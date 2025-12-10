#!/usr/bin/env node

/**
 * OpenAPI to GitBook Converter
 *
 * This script transforms an OpenAPI spec to add proper tag groupings
 * for better organization in GitBook documentation.
 *
 * Configuration is loaded from a JSON file for easy editing by non-developers.
 *
 * Usage:
 *   node scripts/convert-openapi-for-gitbook.js [--config path/to/config.json]
 *
 * Default config: scripts/openapi-gitbook-config.json
 */

const fs = require("fs");
const path = require("path");

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let configPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" || args[i] === "-c") {
      configPath = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { configPath };
}

function printHelp() {
  console.log(`
OpenAPI to GitBook Converter

Transforms an OpenAPI spec to add proper tag groupings for GitBook documentation.

USAGE:
  node scripts/convert-openapi-for-gitbook.js [OPTIONS]

OPTIONS:
  -c, --config <path>   Path to configuration JSON file
                        (default: scripts/openapi-gitbook-config.json)
  -h, --help            Show this help message

CONFIGURATION FILE FORMAT:
  {
    "tagGroups": [
      {
        "name": "API Reference",
        "tags": ["OAuth & Consent", "Presets", ...]
      }
    ],
    "tags": [
      {
        "name": "Tag Name",
        "description": "Description shown in docs",
        "patterns": ["/api/", "/other-prefix"]
      }
    ],
    "defaultTag": "Other",
    "input": "openapi.json",
    "output": "openapi-gitbook.json"
  }

PATTERN MATCHING:
  - Patterns are matched against the start of each route path
  - First matching pattern wins (order matters!)
  - Use "/" at the end for prefix matching (e.g., "/oauth/")
  - Omit "/" at the end for exact start matching (e.g., "/userinfo")

TAG GROUPS:
  - Use "tagGroups" to create parent navigation sections in GitBook
  - Each group has a "name" and an array of "tags" it contains
  - Tags listed in groups will appear nested under the group name

EXAMPLES:
  # Use default config
  node scripts/convert-openapi-for-gitbook.js

  # Use custom config
  node scripts/convert-openapi-for-gitbook.js --config my-config.json
`);
}

/**
 * Load and validate configuration
 */
function loadConfig(configPath) {
  const resolvedPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Config file not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`Loading config from: ${resolvedPath}`);
  const config = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

  // Validate required fields
  if (!config.tags || !Array.isArray(config.tags)) {
    console.error('Error: Config must have a "tags" array');
    process.exit(1);
  }

  for (const tag of config.tags) {
    if (!tag.name) {
      console.error('Error: Each tag must have a "name" field');
      process.exit(1);
    }
    if (!tag.patterns || !Array.isArray(tag.patterns)) {
      console.error(`Error: Tag "${tag.name}" must have a "patterns" array`);
      process.exit(1);
    }
  }

  // Set defaults
  config.defaultTag = config.defaultTag || "Other";
  config.input = config.input || "openapi.json";
  config.output = config.output || "openapi-gitbook.json";
  config.tagGroups = config.tagGroups || [];

  return config;
}

/**
 * Determine the tag for a given path based on config patterns
 */
function getTagForPath(routePath, config) {
  for (const tag of config.tags) {
    for (const pattern of tag.patterns) {
      if (routePath.startsWith(pattern)) {
        return tag.name;
      }
    }
  }
  return config.defaultTag;
}

/**
 * Main conversion function
 */
function convertOpenApiForGitbook(config) {
  const inputPath = path.resolve(process.cwd(), config.input);
  const outputPath = path.resolve(process.cwd(), config.output);

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Read input file
  console.log(`Reading OpenAPI spec from: ${inputPath}`);
  const openApiSpec = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  // Build tag definitions for the spec (only name and description)
  openApiSpec.tags = config.tags.map((tag) => ({
    name: tag.name,
    description: tag.description || "",
  }));

  // Add tag groups if configured (GitBook/Redoc extension)
  if (config.tagGroups && config.tagGroups.length > 0) {
    openApiSpec["x-tagGroups"] = config.tagGroups.map((group) => ({
      name: group.name,
      tags: group.tags,
    }));
    console.log(`Added ${config.tagGroups.length} tag group(s)`);
  }

  // Process each path and add appropriate tags
  const paths = openApiSpec.paths || {};
  let taggedCount = 0;
  const tagCounts = {};

  for (const [routePath, methods] of Object.entries(paths)) {
    const tag = getTagForPath(routePath, config);
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;

    // Add tag to each HTTP method in this path
    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation === "object" && operation !== null) {
        operation.tags = [tag];
        taggedCount++;
      }
    }
  }

  // Write output file
  console.log(`Writing converted spec to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));

  // Print summary
  console.log("\n✅ Conversion complete!\n");

  if (config.tagGroups && config.tagGroups.length > 0) {
    console.log("Tag groups:");
    console.log("─".repeat(40));
    for (const group of config.tagGroups) {
      console.log(`  📁 ${group.name}`);
      for (const tagName of group.tags) {
        const count = tagCounts[tagName] || 0;
        console.log(`     └─ ${tagName.padEnd(22)} ${count} route(s)`);
      }
    }
    console.log("─".repeat(40));
  } else {
    console.log("Tag distribution:");
    console.log("─".repeat(40));
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    for (const [tag, count] of sortedTags) {
      console.log(`  ${tag.padEnd(25)} ${count} route(s)`);
    }
    console.log("─".repeat(40));
  }

  console.log(`Total operations tagged: ${taggedCount}`);
  console.log(`\nOutput file: ${outputPath}`);
}

// Main execution
const { configPath } = parseArgs();
const defaultConfigPath = path.join(__dirname, "openapi-gitbook-config.json");
const finalConfigPath = configPath || defaultConfigPath;

const config = loadConfig(finalConfigPath);
convertOpenApiForGitbook(config);

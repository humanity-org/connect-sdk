import type { HpConfiguration as DiscoveryConfiguration } from '@structures/HpConfiguration';
import { PRESET_SCOPE_MAP, PresetName, PresetScope } from '@utils/ts-types/presets';
import { camelToSnake, snakeToCamel } from '../internal/casing';

export type DeveloperPresetKey = string;

export interface PresetDescriptor {
  developerKey: DeveloperPresetKey;
  presetName: string;
  scope: string;
  type?: | "string"
  | "number"
  | "boolean"
  | "integer"
  | "date"
  | "datetime"
  | "array"
  | "enum"
  | "bundled";
  consentText?: string;
  description?: string;
  impliedScopes?: string[];
}

const DEFAULT_PRESET_DESCRIPTORS: PresetDescriptor[] = (
  Object.entries(PRESET_SCOPE_MAP) as Array<[PresetName, PresetScope]>
).map(([presetName, scope]) => ({
  developerKey: snakeToCamel(presetName),
  presetName,
  scope,
}));

export class PresetRegistry {
  private readonly descriptorsByDeveloperKey = new Map<DeveloperPresetKey, PresetDescriptor>();
  private readonly descriptorsByPresetName = new Map<string, PresetDescriptor>();
  private readonly descriptorsByScope = new Map<string, PresetDescriptor>();

  constructor(initialDescriptors: PresetDescriptor[] = DEFAULT_PRESET_DESCRIPTORS) {
    initialDescriptors.forEach((descriptor) => this.register(descriptor));
  }

  register(descriptor: PresetDescriptor): void {
    const normalized: PresetDescriptor = {
      ...descriptor,
      developerKey: descriptor.developerKey ?? snakeToCamel(descriptor.presetName),
      presetName: descriptor.presetName ?? camelToSnake(descriptor.developerKey),
      scope: descriptor.scope,
      impliedScopes: descriptor.impliedScopes ?? [],
    };
    this.descriptorsByDeveloperKey.set(normalized.developerKey, normalized);
    this.descriptorsByPresetName.set(normalized.presetName, normalized);
    this.descriptorsByScope.set(normalized.scope, normalized);
  }

  syncFromConfiguration(configuration: DiscoveryConfiguration): void {
    configuration.presets_available.forEach((preset) => this.upsertFromConfigPreset(preset));
  }

  upsertFromConfigPreset(preset: DiscoveryConfiguration['presets_available'][number]): void {
    this.register({
      developerKey: snakeToCamel(preset.name),
      presetName: preset.name,
      scope: preset.scope,
      consentText: preset.consent_text,
      description: preset.description,
      type: preset.type,
    });
  }

  resolveByDeveloperKey(key: DeveloperPresetKey): PresetDescriptor {
    const descriptor =
      this.descriptorsByDeveloperKey.get(key) ??
      this.descriptorsByPresetName.get(camelToSnake(key)) ??
      this.createPlaceholderDescriptor(key);
    return descriptor;
  }

  resolveByPresetName(name: string): PresetDescriptor {
    const descriptor =
      this.descriptorsByPresetName.get(name) ??
      this.descriptorsByDeveloperKey.get(snakeToCamel(name)) ??
      this.createPlaceholderDescriptor(name);
    return descriptor;
  }

  resolveByScope(scope: string): PresetDescriptor | undefined {
    const existing =
      this.descriptorsByScope.get(scope) ??
      (scope.startsWith('hp:presets.')
        ? this.descriptorsByPresetName.get(scope.replace('hp:presets.', ''))
        : undefined);
    if (existing) {
      return existing;
    }
    if (scope.startsWith('hp:presets.')) {
      return this.createPlaceholderDescriptor(scope.replace('hp:presets.', ''));
    }
    return undefined;
  }

  list(): PresetDescriptor[] {
    return Array.from(new Set(this.descriptorsByDeveloperKey.values()));
  }

  private createPlaceholderDescriptor(identifier: string): PresetDescriptor {
    const derivedName = identifier.startsWith('hp:presets.')
      ? identifier.replace('hp:presets.', '')
      : identifier;
    const presetName = derivedName.includes('_') ? derivedName : camelToSnake(derivedName);
    const developerKey = snakeToCamel(presetName);
    const scope =
      PRESET_SCOPE_MAP[presetName as PresetName] ??
      (identifier.startsWith('hp:') ? identifier : `hp:presets.${presetName}`);

    const descriptor: PresetDescriptor = {
      developerKey,
      presetName,
      scope,
      impliedScopes: [],
    };
    this.register(descriptor);
    return descriptor;
  }
}


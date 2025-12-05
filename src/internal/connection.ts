import type { IConnection } from '@nestia/fetcher';
import type { EnvironmentDescriptor } from './environment';

export interface ConnectionFactoryOptions {
  environment: EnvironmentDescriptor;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

export class HttpConnectionFactory {
  private readonly environment: EnvironmentDescriptor;
  private readonly fetch?: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: ConnectionFactoryOptions) {
    this.environment = options.environment;
    this.fetch = options.fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  createCoreConnection(accessToken?: string, headers?: Record<string, string>): IConnection {
    return this.createConnection({
      baseUrl: this.join(this.environment.apiBaseUrl, 'api/v1'),
      accessToken,
      headers,
    });
  }

  createDiscoveryConnection(headers?: Record<string, string>): IConnection {
    return this.createConnection({
      baseUrl: this.environment.discoveryBaseUrl ?? this.environment.apiBaseUrl,
      headers,
    });
  }

  createHealthConnection(headers?: Record<string, string>): IConnection {
    return this.createConnection({
      baseUrl: this.environment.discoveryBaseUrl ?? this.environment.apiBaseUrl,
      headers,
    });
  }

  createRootConnection(accessToken?: string, headers?: Record<string, string>): IConnection {
    return this.createConnection({
      baseUrl: this.environment.apiBaseUrl,
      accessToken,
      headers,
    });
  }

  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  getFetch(): typeof fetch | undefined {
    return this.fetch;
  }

  getEnvironment(): EnvironmentDescriptor {
    return this.environment;
  }

  private createConnection({
    baseUrl,
    accessToken,
    headers,
  }: {
    baseUrl: string;
    accessToken?: string;
    headers?: Record<string, string>;
  }): IConnection {
    const resolvedHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
    };
    if (accessToken) {
      resolvedHeaders.Authorization = `Bearer ${accessToken}`;
    }

    return {
      host: stripTrailingSlash(baseUrl),
      headers: Object.keys(resolvedHeaders).length ? resolvedHeaders : undefined,
      fetch: this.fetch,
    };
  }

  private join(base: string, path: string): string {
    return `${stripTrailingSlash(base)}/${stripLeadingSlash(path)}`;
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function stripLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}


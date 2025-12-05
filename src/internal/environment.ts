export type EnvironmentName = 'production' | 'staging' | 'testnet';

export interface EnvironmentDescriptor {
  name: EnvironmentName | string;
  apiBaseUrl: string;
  discoveryBaseUrl?: string;
}

const DEFAULT_ENVIRONMENTS: Record<EnvironmentName, EnvironmentDescriptor> = {
  production: {
    name: 'production',
    apiBaseUrl: 'https://api.humanity.org',
    discoveryBaseUrl: 'https://api.humanity.org',
  },
  staging: {
    name: 'staging',
    apiBaseUrl: 'https://api-staging.humanity.org',
    discoveryBaseUrl: 'https://api-staging.humanity.org',
  },
  testnet: {
    name: 'testnet',
    apiBaseUrl: 'https://api-testnet.humanity.org',
    discoveryBaseUrl: 'https://api-testnet.humanity.org',
  },
};

export class EnvironmentRegistry {
  private readonly descriptors: Map<string, EnvironmentDescriptor>;

  constructor(initial?: EnvironmentDescriptor[]) {
    this.descriptors = new Map(
      Object.values(DEFAULT_ENVIRONMENTS).map((descriptor) => [descriptor.name, descriptor]),
    );

    if (initial?.length) {
      initial.forEach((descriptor) => this.register(descriptor));
    }
  }

  register(descriptor: EnvironmentDescriptor): void {
    this.descriptors.set(descriptor.name, {
      ...descriptor,
      discoveryBaseUrl: descriptor.discoveryBaseUrl ?? descriptor.apiBaseUrl,
    });
  }

  resolve(name?: EnvironmentName | string): EnvironmentDescriptor {
    if (!name) {
      return this.descriptors.get('production')!;
    }
    return (
      this.descriptors.get(name) ??
      (() => {
        const fallback = Array.from(this.descriptors.values()).find(
          (descriptor) => descriptor.name.toLowerCase() === name.toLowerCase(),
        );
        if (fallback) return fallback;
        throw new Error(`Unknown Humanity SDK environment "${name}"`);
      })()
    );
  }

  list(): EnvironmentDescriptor[] {
    return Array.from(this.descriptors.values());
  }
}


import type { HpConfiguration as DiscoveryConfiguration } from '@structures/HpConfiguration';
import { camelToSnake, snakeToCamel } from '../internal/casing';
import { PresetRegistry, type DeveloperPresetKey } from './preset-registry';

export class ScopesAdapter {
  constructor(private readonly registry: PresetRegistry) {}

  ingestConfiguration(configuration: DiscoveryConfiguration): void {
    this.registry.syncFromConfiguration(configuration);
  }

  toAuthorizationScopes(keys: DeveloperPresetKey[]): string[] {
    const normalizedKeys = Array.from(new Set(keys.map((key) => key.trim()).filter(Boolean)));
    return normalizedKeys.map((key) => this.registry.resolveByDeveloperKey(key).scope);
  }

  toPresetName(key: DeveloperPresetKey): string {
    return this.registry.resolveByDeveloperKey(key).presetName;
  }

  toDeveloperKey(presetName: string): DeveloperPresetKey {
    return this.registry.resolveByPresetName(presetName).developerKey;
  }

  fromGrantedScopes(scopes: string[] | string | undefined): DeveloperPresetKey[] {
    if (!scopes) return [];
    const scopeList = Array.isArray(scopes) ? scopes : scopes.split(' ');
    return scopeList
      .map((scope) => scope.trim())
      .filter(Boolean)
      .map((scope) => {
        const descriptor = this.registry.resolveByScope(scope);
        if (descriptor) return descriptor.developerKey;
        if (scope.startsWith('hp:presets.')) return snakeToCamel(scope.replace('hp:presets.', ''));
        return camelToSnake(scope) === scope ? snakeToCamel(scope) : scope;
      });
  }
}


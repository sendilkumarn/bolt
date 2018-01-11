// @flow
import * as semver from 'semver';

export opaque type Version = string;

export type INCREMENT_TYPE =
  | 'patch'
  | 'minor'
  | 'major'
  | 'prepatch'
  | 'preminor'
  | 'premajor'
  | 'prerelease';

export function toVersion(version: string): Version {
  if (semver.valid(version)) {
    return version;
  } else {
    throw new Error(
      `Invalid semver version: ${version} (See https://github.com/npm/node-semver)`
    );
  }
}

export function getPrereleaseType(version: Version): string | null {
  let parts = semver.prerelease(version);
  if (parts) return parts[0];
  return null;
}

export function increment(version: Version, type: INCREMENT_TYPE) {
  let prereleaseType = getPrereleaseType(version) || 'beta';
  return semver.inc(version, type, prereleaseType);
}

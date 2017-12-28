// @flow
import * as options from '../utils/options';
import { BoltError } from '../utils/errors';
import * as git from '../utils/git';

export type VersionOptions = {};

export function toVersionOptions(
  args: options.Args,
  flags: options.Flags
): VersionOptions {
  return {};
}

async function getLastVersionCommitForPackageConfig(
  filePath: string,
  { cwd: string }
) {
  let commits = await git.getCommitsToFile(filePath, { cwd: opts.cwd });
  let matchedCommit = null;

  for (let commit of commits) {
    let parentCommit = await git.getCommitParent(commit);
    if (!parentCommit) continue;

    let fileContentsBefore = await git.showFileAtCommit(commit);
    let fileContentsAfter = await git.showFileAtCommit(filePath);

    let jsonBefore = JSON.parse(fileContentsBefore);
    let jsonAfter = JSON.parse(fileContentsAfter);

    if (jsonAfter.version !== jsonBefore.version) {
      matchedCommit = commit;
      break;
    }
  }

  return matchedCommit;
}

export async function version(opts: VersionOptions) {
  throw new BoltError('Unimplemented command "version"');
}

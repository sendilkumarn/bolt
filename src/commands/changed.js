// @flow
import * as options from '../utils/options';
import { BoltError } from '../utils/errors';
import * as messages from '../utils/messages';
import * as logger from '../utils/logger';
import getWorkspaces from '../functions/getWorkspaces';
import pkgDir from 'pkg-dir';

import * as git from '../utils/git';

export type ChangedOptions = {};

export function toChangedOptions(
  args: options.Args,
  flags: options.Flags
): ChangedOptions {
  return {
    remote: options.string(flags.remote, 'remote')
  };
}

export async function changed(opts: ChangedOptions) {
  const remote = opts.remote || 'origin';
  let changedDirs = new Set();
  try {
    // git fetch origin
    logger.info(messages.gitFetching(remote), {
      emoji: '🎣',
      prefix: false
    });
    await git.fetch();

    // git diff origin/master --name-only
    logger.info(messages.gitGettingDiff(remote), {
      emoji: '🧐',
      prefix: false
    });
    const changedFiles = await git.diff(['origin/master', '--name-only']);

    const changedFilesList = changedFiles.stdout.split('/n');

    changedFilesList.forEach(changedFile => {
      changedDirs.add(pkgDir.sync(changedFile));
    });

    return changedDirs;
  } catch (error) {
    throw new BoltError(error);
  }
}

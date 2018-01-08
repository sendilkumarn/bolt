// Parts of this source are modified from lerna:
// lerna: https://github.com/lerna/lerna/blob/master/LICENSE
// @flow
import { BoltError } from './errors';
import * as logger from './logger';
import * as messages from './messages';
import * as processes from './processes';
import * as path from 'path';
import pLimit from 'p-limit';
import slash from 'slash';
import tempWrite from 'temp-write';
import * as os from 'os';

// We should never run more than one git command at a time, git enforces this
// for a lot of commands and will error.
const gitCommandLimit = pLimit(1);

opaque type CommitHash = string;

function git(args: Array<string>, opts: processes.SpawnOptions) {
  return gitCommandLimit(() => {
    return processes.spawn('git', args, { silent: true, ...opts });
  });
}

function toGitPath(cwd: string, filePath: string) {
  return slash(path.relative(cwd, filePath));
}

function isGitFatalError(err) {
  return err instanceof processes.ChildProcessError && err.code === 128;
}

export async function getRootDirectory(opts: { cwd: string }) {
  let dir = null;
  try {
    let res = await git(['rev-parse', '--show-toplevel'], {
      cwd: opts.cwd
    });

    let { stdout } = res;
    dir = stdout.trim();
  } catch (err) {
    if (!isGitFatalError(err)) {
      throw err;
    }
  }
  return dir;
}

export async function initRepository(opts: { cwd: string }) {
  await git(['init'], { cwd: opts.cwd });
}

export async function addFiles(
  filePaths: Array<string>,
  opts: { cwd: string }
) {
  let gitPaths = filePaths.map(filePath => toGitPath(opts.cwd, filePath));
  await git(['add', ...gitPaths], { cwd: opts.cwd });
}

export async function addAll(opts: { cwd: string }) {
  await git(['add', '-A'], { cwd: opts.cwd });
}

export async function commit(message: string, opts: { cwd: string }) {
  let args = ['commit'];

  if (message.includes(os.EOL)) {
    args.push('-F', await tempWrite(message, 'bolt-commit.txt'));
  } else {
    args.push('-m', message);
  }

  await git(args, { cwd: opts.cwd });
}

export async function addTag(tagName: string, opts: { cwd: string }) {
  await git(['tag', tagName, '-m', tagName], { cwd: opts.cwd });
}

export async function removeTag(tagName: string, opts: { cwd: string }) {
  await git(['tag', '-d', tagName], { cwd: opts.cwd });
}

export async function getCommitsToFile(
  filePath: string,
  opts: { cwd: string }
): Promise<Array<CommitHash>> {
  let gitPath = toGitPath(opts.cwd, filePath);
  try {
    let { stdout } = await git(
      ['log', '--pretty=format:%H', '--follow', gitPath],
      {
        cwd: opts.cwd
      }
    );
    return stdout.trim().split(os.EOL);
  } catch (err) {
    if (!isGitFatalError(err)) {
      throw err;
    }
  }
  return [];
}

export async function getCommitParent(
  commitHash: CommitHash,
  opts: { cwd: string }
): Promise<CommitHash | null> {
  try {
    let { stdout } = await git(['rev-parse', `${commitHash}^`], {
      cwd: opts.cwd
    });
    return stdout.trim();
  } catch (err) {
    if (!isGitFatalError(err)) {
      throw err;
    }
  }
  return null;
}

export async function showFileAtCommit(
  filePath: string,
  commitHash: CommitHash,
  opts: { cwd: string }
) {
  let gitPath = toGitPath(opts.cwd, filePath);
  let { stdout } = await git(['show', `${commitHash}:${gitPath}`], {
    cwd: opts.cwd
  });
  return stdout;
}

export const MAGIC_EMPTY_STATE_HASH: CommitHash =
  '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

export async function getDiffForPathSinceCommit(
  filePath: string,
  commitHash: CommitHash,
  opts: { cwd: string }
) {
  let gitPath = toGitPath(opts.cwd, filePath);
  let { stdout } = await git(
    ['diff', commitHash, '--color=always', '--', filePath],
    {
      cwd: opts.cwd
    }
  );
  return stdout.trim();
}

export async function status(opts: { cwd: string }) {
  let { stdout } = await git(['status', '--porcelain'], {
    cwd: opts.cwd
  });
  return stdout.trim();
}

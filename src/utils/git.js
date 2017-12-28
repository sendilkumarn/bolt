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

function git(args: Array<string>, opts: processes.SpawnOptions) {
  return gitCommandLimit(() =>
    processes.spawn('git', args, { silent: true, ...opts })
  );
}

function toGitPath(cwd: string, filePath: string) {
  return slash(path.relative(cwd, filePath));
}

function isGitFatalError(err) {
  return err instanceof processes.ChildProcessError && err.code === 128;
}

export async function isInitialized(opts: { cwd: string }) {
  let res = false;
  try {
    await git(['rev-parse'], { cwd: opts.cwd });
    res = true;
  } catch (err) {
    if (!isGitFatalError(err)) {
      throw err;
    }
  }
  return res;
}

export async function addFiles(
  filePaths: Array<string>,
  opts: { cwd: string }
) {
  let gitPaths = filePaths.map(filePath => toGitPath(opts.cwd, filePath));
  await git(['add', ...gitPaths], { cwd: opts.cwd });
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

export async function hasTags(opts: { cwd: string }) {
  let { stdout } = await git(['tag'], { cwd: opts.cwd });
  return !!stdout.trim();
}

export async function getCommitsToFile(
  filePath: string,
  opts: { cwd: string }
) {
  let gitPath = toGitPath(opts.cwd, filePath);
  try {
    let { stdout } = await git(
      ['log', '--pretty=format:%H', '--follow', filePath],
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
  commitHash: string,
  opts: { cwd: string }
) {
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
  commitHash: string,
  opts: { cwd: string }
) {
  let gitPath = toGitPath(opts.cwd, filePath);
  let { stdout } = await git(['show', `${commitHash}:${gitPath}`], {
    cwd: opts.cwd
  });
  return stdout;
}

export async function getDiffForPathSinceCommit(
  filePath: string,
  commitHash: string,
  opts: { cwd: string }
) {
  let gitPath = toGitPath(opts.cwd, filePath);
  let { stdout } = await git(
    ['diff', '--name-only', commitHash, '--', filePath],
    {
      cwd: opts.cwd
    }
  );
  return stdout.trim();
}

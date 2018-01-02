// @flow
import Project from '../Project';
import Repository from '../Repository';
import * as options from '../utils/options';
import * as changes from '../utils/changes';
import * as git from '../utils/git';
import { BoltError } from '../utils/errors';

export type VersionOptions = {
  cwd?: string
};

export function toVersionOptions(
  args: options.Args,
  flags: options.Flags
): VersionOptions {
  return {
    cwd: options.string(flags.cwd, 'cwd')
  };
}

export async function version(opts: VersionOptions) {
  let cwd = opts.cwd || process.cwd();
  let project = await Project.init(cwd);
  let repo = await Repository.init(project.pkg.dir);
  let workspaces = await project.getWorkspaces();

  let status = await git.status({ cwd: repo.dir });

  if (status.length) {
    throw new BoltError(
      'Cannot run `bolt version` while you have a dirty tree:\n\n' +
        status
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n')
    );
  }

  let versionCommits = await changes.getWorkspaceVersionCommits(
    repo,
    workspaces
  );

  let diffs = [];

  for (let workspace of workspaces) {
    // await git.getDiffForPathSinceCommit(workspace.pkg.dir);
  }

  console.log(versionCommits);
}

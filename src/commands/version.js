// @flow
import Project from '../Project';
import Repository from '../Repository';
import * as options from '../utils/options';
import * as changes from '../utils/changes';
import * as git from '../utils/git';
import * as prompt from '../utils/prompt';
import * as versions from '../utils/versions';
import * as constants from '../constants';
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

  let diffs = new Map();
  let changedWorkspaces = [];

  for (let workspace of workspaces) {
    let versionCommit = versionCommits.get(workspace);

    if (!versionCommit) {
      versionCommit = git.MAGIC_EMPTY_STATE_HASH;
    }

    let diff = await git.getDiffForPathSinceCommit(
      workspace.pkg.dir,
      versionCommit,
      { cwd: repo.dir }
    );

    diffs.set(workspace, diff);
    if (diff.length) {
      changedWorkspaces.push(workspace);
    }
  }

  let newVersions = new Map();

  for (let changedWorkspace of changedWorkspaces) {
    let name = changedWorkspace.pkg.config.getName();
    let currentVersionStr = changedWorkspace.pkg.config.getVersion();
    let currentVersion = versions.toVersion(currentVersionStr);
    let nextVersion = null;

    while (!nextVersion) {
      let choice = await prompt.list(
        `Select a new version for ${name} (currently ${currentVersionStr})`,
        [
          versions.getPrereleaseType(currentVersion) && {
            name: `Prerelease (${versions.increment(
              currentVersion,
              'prerelease'
            )})`
          },
          {
            name: `Patch (${versions.increment(currentVersion, 'patch')})`,
            value: 'patch'
          },
          {
            name: `Minor (${versions.increment(currentVersion, 'minor')})`,
            value: 'minor'
          },
          {
            name: `Major (${versions.increment(currentVersion, 'major')})`,
            value: 'major'
          },
          {
            name: `Prepatch (${versions.increment(
              currentVersion,
              'prepatch'
            )})`,
            value: 'prepatch'
          },
          {
            name: `Preminor (${versions.increment(
              currentVersion,
              'preminor'
            )})`,
            value: 'preminor'
          },
          {
            name: `Premajor (${versions.increment(
              currentVersion,
              'premajor'
            )})`,
            value: 'premajor'
          },
          prompt.separator(),
          {
            name: 'diff',
            value: 'diff'
          }
        ].filter(Boolean)
      );

      if (choice === 'diff') {
        console.log(diffs.get(changedWorkspace));
      } else {
      }
    }

    // console.log(changedWorkspace.pkg.config.getName());
    // console.log(changedWorkspace.pkg.dir);
    // console.log(diffs.get(changedWorkspace));
  }

  // console.log(diffs);
}

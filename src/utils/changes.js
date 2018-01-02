// @flow
import Repository from '../Repository';
import Workspace from '../Workspace';
import * as git from '../utils/git';

async function getLastVersionCommitForWorkspace(
  repo: Repository,
  workspace: Workspace
) {
  let filePath = workspace.pkg.config.filePath;
  let cwd = repo.dir;
  let commits = await git.getCommitsToFile(filePath, { cwd });
  let matchedCommit = null;

  for (let commit of commits) {
    let parentCommit = await git.getCommitParent(commit, { cwd });
    if (!parentCommit) continue;

    let before = await git.showFileAtCommit(parentCommit, filePath, { cwd });
    let after = await git.showFileAtCommit(commit, filePath, { cwd });

    let jsonBefore = JSON.parse(before);
    let jsonAfter = JSON.parse(after);

    if (jsonAfter.version !== jsonBefore.version) {
      matchedCommit = commit;
      break;
    }
  }

  return matchedCommit;
}

export async function getWorkspaceVersionCommits(
  repo: Repository,
  workspaces: Array<Workspace>
) {
  let versionCommits = new Map();

  for (let workspace of workspaces) {
    let commit = await getLastVersionCommitForWorkspace(repo, workspace);
    versionCommits.set(workspace, commit);
  }

  return versionCommits;
}

// @flow
import { version, toVersionOptions } from '../version';
import { copyFixtureIntoTempDir } from 'jest-fixtures';
import * as git from '../../utils/git';
import * as fs from '../../utils/fs';
import { BoltError } from '../../utils/errors';
import * as path from 'path';

describe('bolt version', () => {
  test('dirty tree', async () => {
    let cwd = await copyFixtureIntoTempDir(__dirname, 'simple-repo');
    let opts = toVersionOptions([], { cwd });

    // unstaged
    await git.initRepository({ cwd });
    await expect(version(opts)).rejects.toBeInstanceOf(BoltError);

    // staged
    await git.addAll({ cwd });
    await expect(version(opts)).rejects.toBeInstanceOf(BoltError);

    // unstaged on top of commit
    await git.commit('test', { cwd });
    await fs.writeFile(path.join(cwd, 'foo'), '');
    await expect(version(opts)).rejects.toBeInstanceOf(BoltError);
  });

  //
  // test('uncommitted', async () => {
  //   let cwd = await copyFixtureIntoTempDir(__dirname, 'simple-repo');
  //   await git.initRepository({ cwd });
  //
  //
  //   await version(toVersionOptions([], { cwd }));
  //
  //   // await expect().rejects.toBeInstanceOf(BoltError);
  //
  //   // expect(await depIsInstalled(projectDir, 'new-dep')).toEqual(false);
  //   // await add(
  //   //   toAddOptions(['new-dep'], {
  //   //     cwd: projectDir
  //   //   })
  //   // );
  //   // expect(yarn.add).toHaveBeenCalledTimes(1);
  //   // expect(await depIsInstalled(projectDir, 'new-dep')).toEqual(true);
  // });
});

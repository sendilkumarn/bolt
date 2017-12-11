// @flow

import * as processes from './processes';

export async function fetch(args?: Array<string> = []) {
  let spawnArgs = ['fetch'];

  if (args.length) {
    spawnArgs = spawnArgs.concat(args);
  }

  return await processes.spawn('git', spawnArgs, {});
}

export async function log(args?: Array<string>) {
  let spawnArgs = ['log'];

  if (args.length) {
    spawnArgs = spawnArgs.concat(spawnArgs);
  }

  return await processes.spawn('git', spawnArgs, {});
}

export async function revParse(args?: Array<string> = []) {
  let spawnArgs = ['rev-parse'];

  if (args.length) {
    spawnArgs = spawnArgs.concat(args);
  }

  return await processes.spawn('git', spawnArgs, {
    silent: true
  });
}

export async function diff(args?: Array<string>) {
  let spawnArgs = ['diff'];

  if (args.length) {
    spawnArgs = spawnArgs.concat(args);
  }

  return await processes.spawn('git', spawnArgs, {
    silent: true
  });
}

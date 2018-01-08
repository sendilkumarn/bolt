import inquirer from 'inquirer';

const prompt = inquirer.createPromptModule();
const KEY = 'value';

type Choice<Value> = { name: string, value: string };
type Choices<Value> = Array<Choice<Value> | Separator>;
opaque type Separator = Object;

export function separator(): Separator {
  return new inquirer.Separator();
}

export async function list<Value: string>(
  message: string,
  choices: Choices<Value>
): Value {
  let answers = await prompt([
    {
      type: 'list',
      name: KEY,
      message,
      choices
    }
  ]);
  return answers[KEY];
}

export async function input(message: string) {
  let answers = await prompt([
    {
      type: 'input',
      name: KEY,
      message
    }
  ]);
  return answers[KEY];
}

export async function password(message: string) {
  let answers = await prompt([
    {
      type: 'password',
      name: KEY,
      message
    }
  ]);
  return answers[KEY];
}

export async function editor(message: string) {
  let answers = await prompt([
    {
      type: 'editor',
      name: KEY,
      message
    }
  ]);
  return answers[KEY];
}

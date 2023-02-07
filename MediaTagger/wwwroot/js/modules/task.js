export async function runParallel(...args) {
  const tasks = [];
  for (const func of args) {
    tasks.push(func());
  }
  return Promise.all(tasks);
}

export async function runSerial(...args) {
  const tasks = [];
  while (args.length > 0) {
    const func = args.shift();
    // eslint-disable-next-line no-await-in-loop
    tasks.push(await func());
  }
  return tasks;
}

export default { runParallel, runSerial };

export async function runParallel(...args) {
  let tasks = [];
  for (let func of args) {
    tasks.push(func());
  }
  return Promise.all(tasks);
}

export async function runSerial(...args) {
  let tasks = [];
  for (let func of args) {
    tasks.push(await func());
  }
  return tasks;
}

export default { runParallel, runSerial };

export async function runParallel(...args) {
  var tasks = [];
  for (var func of args) {
    tasks.push(func());
  }
  return Promise.all(tasks);
}

export async function runSerial(...args) {
  var tasks = [];
  for (var func of args) {
    tasks.push(await func());
  }
  return tasks;
}

export default { runParallel, runSerial };

let env = null;

if (typeof process === 'undefined') {
  // browser, so set to the correct env file.
  let baseEnv = {};
  async function importEnv(path) {
    let val = await import(path);
    return val.default;
  }
  if (location.port == '6080') {
    // env = env_dev;
    baseEnv = await importEnv('./browser/browser-env-dev.js');
  } else {
    baseEnv = await importEnv('./browser/browser-env-prod.js');
  }
  env = baseEnv.get();
  env.load = async function (url) {
    console.log('load env ' + url);
    try {
      const absolute = new URL(url, location);
      env.drHostEnv = await import(absolute);
      if (env.drHostEnv) {
        env.drHostEnv.configure(env);
      }
    } catch (ex) {
      console.error('cannot load environment ' + url);
    }
  };
} else {
  // node.js
  env = process.env;
}
export { env, env as ENV };

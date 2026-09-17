const os = require('node:os');

const originalUserInfo = os.userInfo;
os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch {
    // Some restricted Windows sessions cannot query the OS account. tsx only
    // needs a writable temporary-directory base, so use this safe fallback.
    return {
      username: 'cogava-test',
      uid: -1,
      gid: -1,
      homedir: process.cwd(),
      shell: null,
    };
  }
};

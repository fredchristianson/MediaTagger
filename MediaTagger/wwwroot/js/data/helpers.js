function compareIds(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getId() - b.getId();
}

function compareDates(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getDateTaken() - b.getDateTaken();
}

function compareNames(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getName().localeCompare(b.getName());
}

function toDate(val) {
  if (val == null || val instanceof Date) {
    return val;
  } else {
    try {
      if (typeof val == 'string') {
        return new Date(Date.parse(val));
      }
      return new Date(val);
    } catch (ex) {
      return null;
    }
  }
}

let seed = 0;

function seedRandom() {
  let now = Date.now();
  now = (now % 255) - 128;
  seed = now;
}
seedRandom();

function hash(s) {
  const hash = s.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, s);
  return (hash % 255) + seed;
}
function randomizeItems(a, b) {
  const hashA = hash(a.Name);
  const hashB = hash(b.Name);
  return hashA - hashB;
}

export {
  compareIds,
  compareDates,
  compareNames,
  toDate,
  randomizeItems,
  seedRandom
};

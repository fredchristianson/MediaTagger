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


export  { compareIds, compareDates, compareNames, toDate };

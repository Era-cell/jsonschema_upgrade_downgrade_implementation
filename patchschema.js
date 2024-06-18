import { deepGet, deepSet, deepDelete } from './utilities.js';

const operations = {
  'prefix-until-unique': (obj, { path, value }) => {
    let lastKey = path.pop();
    let newKey = value + lastKey;
    while (deepGet(obj, path.concat(newKey)) !== undefined) {
      newKey = value + newKey;
    }
    const data = deepGet(obj, path.concat(lastKey));
    deepDelete(obj, path.concat(lastKey));
    deepSet(obj, path.concat(newKey), data);
  },
  'prefix-key': (obj, { path, value }) => {
    let lastKey = path.pop();
    let newKey = value + lastKey;
    const data = deepGet(obj, path.concat(lastKey));
    deepDelete(obj, path.concat(lastKey));
    deepSet(obj, path.concat(newKey), data);
  },
  'prefix-value': (obj, { path, value }) => {
    const oldValue = deepGet(obj, path);
    deepSet(obj, path, value + oldValue);
  },
  'replace': (obj, { path, value }) => {
    deepSet(obj, path, value);
  },
  'replace-with-absolute': (obj, { path, value }) => {
    deepSet(obj, path, value);
  },
  'remove': (obj, { path }) => {
    deepDelete(obj, path);
  },
  'remove-substring': (obj, { path, value }) => {
    const oldValue = deepGet(obj, path);
    if (typeof oldValue === 'string') {
      const newValue = oldValue.split(value).join('');
      deepSet(obj, path, newValue);
    }
  },
  'remove-and-append': (obj, { from, to }) => {
    const value = deepGet(obj, from);
    deepDelete(obj, from);
    let target = deepGet(obj, to);
    if (!Array.isArray(target)) {
      deepSet(obj, to, []);
      target = deepGet(obj, to);
    }
    target.push(value);
  },
  'move': (obj, { from, to }) => {
    const value = deepGet(obj, from);
    deepDelete(obj, from);
    deepSet(obj, to, value);
  },
  'add': (obj, { path, value }) => {
    const target = deepGet(obj, path.slice(0, path.length - 1));
    const lastKey = path[path.length - 1];
    if (Array.isArray(target)) {
      if (lastKey === "-") {
        target.push(value);
      } else {
        target.splice(lastKey, 0, value);
      }
    } else {
      deepSet(obj, path, value);
    }
  },
  'copy': (obj, { from, to }) => {
    const value = deepGet(obj, from);
    deepSet(obj, to, value);
  }
};

export  {operations};
  import { deepGet, deepSet, deepDelete, deepCopy } from './utilities.js';

  const operations = {
    // append proeperty
    'append-property': (obj, { from, to }) => {
      const target = deepGet(obj, to);
      const lastKey = from[from.length-1];
      target.push(lastKey);
    },
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
      const absVal = Math.abs(deepGet(obj, path));
      deepSet(obj, path, absVal);
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
      const valueCopy = deepCopy(value);
      const target = deepGet(obj, path.slice(0, path.length - 1));
      const lastKey = path[path.length - 1];
      if (Array.isArray(target)) {
        if (lastKey === "-") {
          target.push(valueCopy);
        } else {
          target.splice(lastKey, 0, valueCopy);
        }
      } else {
        deepSet(obj, path, valueCopy);
      }
    },
    'copy': (obj, { from, to }) => {
      const value = deepGet(obj, from);
      deepSet(obj, to, value);
    },
    'replace-with-1-by-ten-power-value': (obj, { path }) => {
      const value = deepGet(obj, path);
      if (typeof value === 'number') {
        const newValue = 1 / (10 ** value);
        deepSet(obj, path, newValue);
      }
    }
  };

  export  {operations};

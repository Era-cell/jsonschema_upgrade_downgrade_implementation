const deepGet = (obj, path) => path.reduce((o, p) => (o ? o[p] : undefined), obj);
const deepSet = (obj, path, value) => {
  path.slice(0, -1).reduce((o, p) => (o[p] = o[p] || {}), obj)[path.slice(-1)] = value;
};
const deepDelete = (obj, path) => {
  const lastKey = path.pop();
  const parent = deepGet(obj, path);
  if (parent) delete parent[lastKey];
};

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
    const target = deepGet(obj, path);
    if (Array.isArray(target)) {
      if (value === -1) {
        target.push(value);
      } else {
        target.push(value);
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

const applyOperations = (obj, operationsArray) => {
  operationsArray.forEach(op => {
    const { operation, ...params } = op;
    if (operations[operation]) {
      operations[operation](obj, params);
    } else {
      console.error(`Unknown operation: ${operation}`);
    }
  });
};

// Example usage
let jsonObj = {
  "x-a": {
    b: "hello",
    c: "world"
  },
  d: [1, 2, 3],
  "a": "hello"
};

const operationsArray = [
  { operation: 'prefix-until-unique', path: ['a'], value: 'x-' },
  { operation:'prefix-value', path: ['d'], value: 'x-' },
];

applyOperations(jsonObj, operationsArray);
console.log(JSON.stringify(jsonObj, null, 2));

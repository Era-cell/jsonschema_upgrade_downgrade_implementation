import fs from 'fs';

const deepGet = (obj, path) => {
    let currentObj = obj;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (key === '-' && Array.isArray(currentObj)) {
        currentObj = currentObj[currentObj.length - 1];
      } else {
        currentObj = currentObj ? currentObj[key] : undefined;
      }
    }
    return currentObj;
  };
  
  const deepSet = (obj, path, value) => {
    let currentObj = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === '-' && Array.isArray(currentObj)) {
        currentObj = currentObj[currentObj.length - 1];
      } else {
        currentObj[key] = currentObj[key] || {};
        currentObj = currentObj[key];
      }
    }
    const lastKey = path[path.length - 1];
    if (lastKey === '-' && Array.isArray(currentObj)) {
      currentObj[currentObj.length - 1] = value;
    } else {
      currentObj[lastKey] = value;
    }
  };
  
  const deepDelete = (obj, path) => {
    let currentObj = obj;
    let parentObj = null;
    let parentKey = null;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === '-' && Array.isArray(currentObj)) {
        parentObj = currentObj;
        parentKey = currentObj.length - 1;
        currentObj = currentObj[currentObj.length - 1];
      } else {
        parentObj = currentObj;
        parentKey = key;
        currentObj = currentObj[key];
      }
    }
    let lastKey = path[path.length - 1];
    if (lastKey === '-') lastKey = currentObj.length - 1;
    if (Array.isArray(currentObj)) {
      currentObj.splice(lastKey, 1);
    } else {
      delete currentObj[lastKey];
    }
  };

  const isObject = obj => obj && typeof obj === 'object';

  const deepEqual = (obj1, obj2) => {
      if (obj1 === obj2) {
          return true;
      }
      
      if (!isObject(obj1) || !isObject(obj2)) {
          return false;
      }
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) {
          return false;
      }
      
      for (const key of keys1) {
          if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
              return false;
          }
      }
      
      return true;
  };

  function deepCopy(obj) {
    if (typeof obj !== 'object' || obj === null) {
      // Base case: return the same value for non-objects
      return obj;
    }
  
    // Create a new object/array of the same type
    const copy = Array.isArray(obj) ? [] : {};
  
    // Recursively copy properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepCopy(obj[key]);
      }
    }
  
    // Merge with the new object/array
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), copy);
  }

const readJsonFile = (filePath) => {
return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        reject(err);
    } else {
        resolve(JSON.parse(data));
    }
    });
});
};

const obj = {
    "contains": { "type": "string" },
    "minContains": 2,
    "unevaluatedItems": false,
    "allOf": [
    ]
}

// const move = (obj, from = [ "contains" ] , to = [ "allOf" , "-" ]) => {
//     const value = deepGet(obj, from);
//     deepDelete(obj, from);
//     deepSet(obj, to, value);
//   }
// move(obj)

// const add = (obj, path = [ "allOf", "-" ], value = 1) => {
//     const target = deepGet(obj, path.slice(0, path.length-1));
//     console.log(target);
//     if (Array.isArray(target)) {
//       if (path[path.length - 1] === "-") {
//         target.push(value);
//       } else {
//         target.splice(path[path.length - 1], 0, value);
//       }
//     } else {
//       deepSet(obj, path, value);
//     }
//   }

//   add(obj)

// console.log(JSON.stringify(obj, null, 2));

// console.log(deepGet(obj, ["allOf"]));

export {
    deepGet,
    deepSet,
    deepDelete,
    isObject,
    deepEqual,
    deepCopy,
    readJsonFile
};
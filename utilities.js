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
    // console.log(obj, currentObj, lastKey);
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
    return obj; // Base case: return the same value for non-objects
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCopy); // Deep copy for arrays
  }

  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key]); // Deep copy for objects
    }
  }

  return copy;
}

const readJsonFile = async (filePath) => {
  if (typeof window !== 'undefined') {
    // Browser environment
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading JSON in the browser:', error);
      throw error;
    }
  } else if (typeof process !== 'undefined') {
    // Node.js environment
    const fs = await import('fs/promises');
    const path = await import('path');
    try {
      const absolutePath = path.resolve(filePath);
      const data = await fs.readFile(absolutePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading JSON in Node.js:', error);
      throw error;
    }
  } else {
    throw new Error('Unknown environment: Unable to load JSON');
  }
}

export {
    deepGet,
    deepSet,
    deepDelete,
    isObject,
    deepEqual,
    deepCopy,
    readJsonFile
};
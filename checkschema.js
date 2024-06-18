import { deepGet, deepSet, deepDelete } from './utilities.js';

const checkType = (subject, predicate) => {
    if (Array.isArray(predicate)) {
        // Handle the "array" type explicitly
        if (predicate.includes("array") && Array.isArray(subject)) {
            return true;
        }
        // Check if the type of the subject matches any type in the predicate array
        if (!predicate.some((type) => typeof subject === type)) {
            return false;
        }
    } else if (typeof predicate === "string") {
        // Handle the "array" type explicitly
        if (predicate === "array" && Array.isArray(subject)) {
            return true;
        }
        
        if ( predicate === "object" && Array.isArray(subject) ) return false;

        if (typeof subject !== predicate) {
            return false;
        }
    }
    return true;
};

// Operation functions
const operations = {
  'type-is': (target, value) => checkType(target, value),
  'equals': (target, value) => target === value,
  'not-equals': (target, value) => target !== value,
  'size-equals': (target, value) => Array.isArray(target) || typeof target === 'object' ? Object.keys(target).length === value : false,
  'contains': (target, value) => Array.isArray(target) ? target.includes(value) : false,
  'contains-type': (target, value) => Array.isArray(target) ? target.some(item => checkType(target, value)) : false,
  'has-key': (target, value) => typeof target === 'object' && target !== null ? value in target : false,
  "not-has-key": (target, value) => typeof target === 'object' && target !== null ? !(value in target) : false,
  'min-properties': (target, value) => typeof target === 'object' && target !== null ? Object.keys(target).length >= value : false,
  'maximum': (target, value) => typeof target === 'number' ? target <= value : false,
  'match-pattern': (target, value) => typeof target === 'string' ? new RegExp(value).test(target) : false,
  'key-absent': (target, value) => typeof target === 'object' && target !== null ? !(value in target) : false
};


const checkCondition = (condition, target) => {
    const { operation, path, value } = condition;
    const subject = deepGet(target, path);
    return operations[operation](subject, value);
};

export {checkCondition};
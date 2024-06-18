import { deepGet, deepEqual, deepCopy } from './utilities.js';
import { operations } from './patchschema.js';
import { checkCondition } from './checkschema.js';

const getIterables = (schema, conditions) => {
    let iterative_indices = [null];
    for (let i=0; i<conditions.length; i++) {
        const path = conditions[i]["path"];
        if (path.includes({})) {
            const iterative_schema = deepGet(schema, path.slice(0, path.indexOf({})));
            if (Array.isArray(iterative_schema))  iterative_indices = Array.from({ length: iterative_schema.length }, (_, i) => iterative_schema.length - 1 - i);
            else iterative_indices = Object.keys(iterative_schema);
            break;
        }
    }
    return iterative_indices;
};

const getProcesssedPath = (path, iterableKey) =>{
    const processed_path = [];
    for (const p of path) {
        if (typeof p === 'object') processed_path.push(iterableKey);
        else processed_path.push(p);
    }
    return processed_path;
}

const applyRule = (schema, rule) => {
    const conditions = rule.condition;
    const transforms = rule.transform;

    const iterableIndices = getIterables(schema, conditions);

    for (const iterableKey of iterableIndices) {
        let conditionAgrees = true;
        for (const condition of conditions) {
            const processed_path = getProcesssedPath(condition["path"], iterableKey);
            if (!checkCondition({ "operation": condition.operation, "path": processed_path, "value": condition.value }, schema)) {
                conditionAgrees = false;
                break;
            }
        }
        if (conditionAgrees) {
            for (const transform of transforms) {
                if (transform.hasOwnProperty("path")){
                    const temp = [...transform["path"]];
                    transform["path"] = getProcesssedPath(transform["path"], iterableKey);
                    const { operation, ...params } = transform;
                    operations[operation](schema, params)
                    transform["path"] = temp;
                }else{
                    const temp_from = [...transform["from"]];
                    const temp_to = [...transform["to"]];
                    transform["from"] = getProcesssedPath(transform["from"], iterableKey);
                    transform["to"] = getProcesssedPath(transform["to"], iterableKey);
                    const { operation, ...params } = transform;
                    operations[operation](schema, params)
                    transform["from"] = temp_from;
                    transform["to"] = temp_to;
                }
            }
        }
    }

};

const applyTest = (test, rule) => {
    const from = test["from"];
    // console.log(from);
    applyRule(from, rule);
    // console.log(from, test["to"]);
    return deepEqual(from, test["to"]);
}

const rule = {
    "vocabulary": "https://json-schema.org/draft/2019-09/vocab/applicator",
    "condition": [ 
        { "operation": "not-has-key", "path": [], "value": "prefixItems" },
        { "operation": "has-key", "path": [], "value": "items" },
        { "operation": "has-key", "path": [], "value": "additionalItems" },
        { "operation": "type-is", "path": [ "items" ], "value": "array" }
    ],
    "transform": [
        { "operation": "move", "to": [ "prefixItems" ], "from": [ "items" ] },
        { "operation": "move", "to": [ "items" ], "from": [ "additionalItems" ] }
    ]
}
const test = {
    "title": "`items` is an array, additionalItems is present",
    "from": {
        "items": [ { "type": "string" } ],
        "additionalItems": false
    },
    "to": {
        "prefixItems": [ { "type": "string" } ],
        "items": false
    }
}
console.log(applyTest(test, rule));

export {
    applyTest
}
import patchschema from "./index.js";
import { matchschema } from "./index.js";

const schema = {
    "properties": {
        "additionalItems": true,
        "items": { "type": "array" },
        "foo": "str",
        "baz": 67,
        "bar": { "type": "string" },
    },
    "$anchor": "te:st",
    "required": ["items", "additionalItems"],
    "arr": [2, [], 4],
    "dependencies": {
        "foo": ["fo", "f"],
        "bar": { "const": "go to bar" },
        "baz": { "enum": ["chaal", "baz"] }
    }
}

// console.log(patchschema(schema, rules));
// console.log(patchschema(schema, [{ "op": "split_and_join", "path": "/$anchor", "split_on": ":", "join_on": "_" }]));

// console.log(patchschema(schema, [{ "op": "split_keyword", "path": "/dependencies", "conditions": [{ "to": "dependentRequired", "schema": { "type": "array" } }, { "to": "dependentSchemas", "schema": { "type": "object" } }] }]));
// console.log(patchschema(schema, [{ "op": "concat", "path": "/arr", "with": "/" }]));
// // -- you have options: provide new array using "array":["hello", "world"], "with": "substring"(default: "")

// console.log(patchschema([1, 2], [{ "op": "append", "path": "", "value": "hellome" }]));

// const matches = {
//     "properties": {
//         "$ref": { "type": "string" }
//     },
//     "required": ["$ref"]
// }
// console.log(patchschema(schema, [{ "op": "iterate", "path": "", "if": matches, "each(key, val)": { "${key}": "${val}" }, "then": [{ "op": "move" }], "else": [] }]));


// console.log(patchschema(schema, [{"op":"remove_all", "path":"/properties", "having":["items", {"type":"string"}]},
// {"op":"remove_all", "path":"/arr", "except":[0, {"type":"string"}, {"const":3}]}]));

// console.log(patchschema(schema, [{ "op": "replace_all", "path": "/arr", "from": [0, { "type": "array" }], "to": ["none", true] }]));

// console.log(patchschema(schema, [{ "op": "reduce", "path": "/arr", "operation": "add" }]));

// console.log(patchschema(schema, [{ "op": "move_all", "path": "/properties", "from": ["(.*i.*)", { "type": "string" }], "to": ["_$1", { "type": "number" }] }]));

console.log(matchschema(schema, [{"key":"properties", "type":["array", "object"], "has":[{"key":"foo", "pattern":".*s$"}]}]));
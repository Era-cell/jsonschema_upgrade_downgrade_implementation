import { matchschema } from "./matchschema.js";

// Check that an object property exists and equals a string
console.log(1, matchschema({ "foo": "hello" }, [ { "key": "foo", "value": { "const": "hello" } } ]));

// Check that an object property exists
console.log(2, matchschema({ "foo": {}, "bar": 22 }, [ { "value": { "has": [ { "type": "object" } ] } } ]));
// maybe we should use plural here because we are checking multuple values to match "has"

// Check that an object property exists and that it has any sibling properties
console.log(3, matchschema({ "$ref": [], "bar": 22 }, [ { "key": "$ref", "minProperties": 2 } ]));

// Check that an object property exists and matches a given regex
console.log(4, matchschema({ "foo": "hello" }, [ { "key": "foo", "value": { "pattern": "^i.*" } } ]));

// Check that an object property exists and that it does not equal a given number/integer
console.log(5, matchschema({ "foo": [], "bar": 0 }, [ { "key":"bar", "value": { "const": 0 },  "not": true} ]));

// Check that an object property exists that it is of a given type
// todo implement integer too
console.log(6, matchschema({ "foo": [], "bar": 0 }, [ { "key":"bar", "value": { "type": "number" }} ]));

// Check that an object property exists that it is of a given type and that a specific adjacent property exists
console.log(7, matchschema({ "foo": [], "bar": {  } }, [ { "key":"foo", "value": { "type": "array" } }, { "key":"bar" } ]));

// Draft 4 to Draft 6 => exclusiveMinimum and exclusiveMaximum
// Check that an adjacent property exists and its type, and that an object property exists
console.log(8, matchschema({ "foo": [], "bar": {  } }, [ { "key":"foo", "value": { "type": "array" } }, { "key":"bar" } ]));

// 2019-09 to 2020-12 => additionalItems, which should be ignored if items is an object
// Check that an object property exists, that is an array, and it contains a specific string item
console.log(9, matchschema({ "foo": 2, "type": [ "any", "number" ] }, [ { "key":"type", "value": { "has": [ {"value": { "const": "any" } }] } } ]));
// TODO to makek this logic simple/ better change it for arrays

// Check that an object property exists, that is an array, and it contains a item of a given type
console.log(10, matchschema({ "foo": 2, "type": [ "any", {} ] }, [ { "key":"type", "value": { "has": [ {"value": { "type": "object" } }] } } ]));

// const schema = {
//     "properties": {
//         "additionalItems": true,
//         "items": [{ "type": "array" }],
//         "type":["any", {}],
//         "foo": "str",
//         "baz": 67,
//         "bar": { "type": "string" },
//     },
//     "$anchor": "te:st",
//     "required": ["items", "additionalItems"],
//     "arr": [2, [], 4],
//     "dependencies": {
//         "foo": ["fo", "f"],
//         "bar": { "const": "go to bar" },
//         "baz": { "enum": ["chaal", "baz"] }
//     }
// }

const schema = {
        "properties": {
            "foo" : {
                "required": true
            },
            "bar": { }
        },
        "arr": [1,2],
        "iaminteger": 4
    }

// Check that an object property exists, that it is an object, and that any of its values has specific property
console.log(11, matchschema(schema, [{"key":"properties", "value": { "type": "object",
                                                    "has":[ { "value": { 
                                                        "type":"object",
                                                        "has": [{ "key": "required" }]  
                                                    }}]
                                                }}]
                                            ));

// Check that an object property exists, that it is an object, and that any of its values are of a specific type
console.log(11, matchschema(schema, [{"key":"properties", "value": { "type": "object",
                                                    "has":[ { "value": { 
                                                        "type":"object",
                                                        "has": [{ "key": "required", "value": { "type":"boolean" } }]  
                                                    }}]
                                                }}]
                                            ));

// Check that an object property exists, that it is an object, and that any of its keys represent Perl regular expressions that are not also ECMA
// Check that an object property exists and its size
// TODO I didn;t get this whether size of obj or array or present obj. Anyhow all sre attaineble.

// Check that an object property exists, that it is an object, and that a value is an array of a certain size
console.log(12, matchschema(schema, [ { "key": "arr", "value": { "has": [ { "minItems":2, "maxItems":2 } ] } } ]));

// Check that an object property is a real number that represents an integer
console.log(13, matchschema(schema, [ { "key": "arr", "value": {  } } ]));

// Check that an object property exists and that is represents a Perl regular expression that is not ECMA


// console.log(matchschema(schema, [{"key":"properties", "value": { 
//                                                     "has":[ {"key":"type", "value": { 
//                                                         "has":[{ "value":{ 
//                                                             "hasAnyOf":[{"const":"any"}, {"type":"array"}]
//                                                             }}
//                                                         ]}} 
//                                                     ]}}
//                                                 ]));
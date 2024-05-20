import * as jsonpatch from 'fast-json-patch/index.mjs';
import { Validator } from 'jsonschema';
var v = new Validator();

function getValueFromPath(obj, path) {
    // Create a deep copy of the object
    const copiedObj = JSON.parse(JSON.stringify(obj));
    if (path == "" || path == "/") return copiedObj
    const parts = path.substring(1).split("/");
    let value = copiedObj;
    for (const part of parts) {
        value = value[part];
        if (value === undefined) {
            return undefined;
        }
    }
    return value;
}

function extractIndexes(array) {
    let indexes = [];
    let keys = []
    let schemas = []
    for (let i = 0; i < array.length; i++) {
        if (typeof array[i] == "number") indexes.push(array[i])
        else if (typeof array[i] == "string") keys.push(array[i])
        else schemas.push(array[i])
    }
    return [indexes, keys, schemas];
}

function removePropertiesByKeys(obj, keysToRemove) {
    keysToRemove.forEach(key => {
        if (obj.hasOwnProperty(key)) {
            delete obj[key];
        }
    });
    return obj;
}

function keepPropertiesByKeys(obj, keysToKeep) {
    return Object.keys(obj)
        .filter(key => keysToKeep.includes(key))
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {});
}

const patchschema = (obj, patches) => {
    for (const patch of patches) {
        let value = getValueFromPath(obj, patch["path"]);

        // split_key - (path, conditions - [to, schema])
        if (patch["op"] == "split_key") {
            obj = jsonpatch.applyPatch(obj, [{ "op": "remove", "path": patch["path"] }]).newDocument;
            const basePath = patch["path"].replace(/\/[^/]+\/?$/, '/');
            for (const condition of patch["conditions"]) {
                obj = jsonpatch.applyPatch(obj, [{ "op": "add", "path": basePath + condition["to"], "value": {} }]).newDocument;
                for (let key in value) {
                    if (v.validate(value[key], condition["schema"]).errors.length == 0) {
                        obj = jsonpatch.applyPatch(obj, [{ "op": "add", "path": basePath + condition["to"] + `/${key}`, "value": value[key] }]).newDocument;
                    }
                }
            }
        }

        // split_and_join - (path, split_on, join_on)
        else if (patch["op"] == "split_and_join") {

            if (typeof value != "string") {
                throw new Error("Not a string");
            }
            const newValue = value.split(patch["split_on"]).join(patch["join_on"]);
            obj = jsonpatch.applyPatch(obj, [{ "op": "replace", "path": patch["path"], "value": newValue }]).newDocument;
        }

        // reduce - path, operation
        else if (patch["op"] == "reduce") {

            if (!Array.isArray(value)) {
                throw new Error("Not an array");
            }
            else if (patch["operation"] == "add") {
                obj = jsonpatch.applyPatch(obj, [{ "op": "add", "path": patch["path"], "value": value.reduce((a, b) => a + b, 0) }]).newDocument;
            }
            else if (patch["operation"] == "multiply") {
                obj = jsonpatch.applyPatch(obj, [{ "op": "add", "path": patch["path"], "value": value.reduce((a, b) => a * b, 1) }]).newDocument;
            }
        }

        // append - (path, value)
        else if (patch["op"] == "append") {
            if (!Array.isArray(value)) {
                throw new Error("Not an array");
            }
            obj = jsonpatch.applyPatch(obj, [{ "op": "add", "path": patch["path"] + "/" + value.length, "value": patch["value"] }]).newDocument;
        }

        // remove_all - (path, except/having)
        else if (patch["op"] == "remove_all") {
            // schema - all maching this schema, except - except/having this schema(this accepts an array:
            // array elements if {} - schema, string - key, whole number - index) (providing invalid index/key throws error)
            // default removes everything
            let state = null
            if ('except' in patch && 'having' in patch) return "No"
            else if ('except' in patch) state = 'except'
            else if ('having' in patch) state = 'having'

            const [indexes, keys, schemas] = state != null ? extractIndexes(patch[state]) : [[], [], []]
            if (Array.isArray(value)) {
                if (keys.length > 0) {
                    "Expected type: integer as an index"
                }
                for (let i = 0; i < value.length; i++) {
                    for (let schema of schemas) {
                        if (v.validate(value[i], schema).errors.length == 0) {
                            indexes.push(i)
                            break
                        }
                    }
                }

                if (state === 'except') value = value.filter((_, index) => indexes.includes(index))
                else if (state === 'having') value = value.filter((_, index) => !indexes.includes(index))
                else value = []

                obj = jsonpatch.applyPatch(obj, [{ "op": "replace", "path": patch["path"], "value": value }]).newDocument;
            }
            else if (typeof value == 'object' && !Array.isArray(value)) {
                if (indexes.length > 0) {
                    return "Expected type: string as a key"
                }
                for (let key of Object.keys(value)) {
                    for (let schema of schemas) {
                        if (v.validate(value[key], schema).errors.length == 0) {
                            keys.push(key)
                            break
                        }
                    }
                }

                if (state == 'except') value = keepPropertiesByKeys(value, keys)
                else if (state == 'having') value = removePropertiesByKeys(value, keys)
                else value = {}

                console.log(keys, state);
                obj = jsonpatch.applyPatch(obj, [{ "op": "replace", "path": patch["path"], "value": value }]).newDocument;
            }
            else {
                throw new Error("Expected Array or Object from the path")
            }
        }

        // replace_all - (path, from - (takes, keys/indexes, schemas) , to - (takes, keys/indexes, schemas))
        else if (patch["op"] == "replace_all") {
            // path, from , to array

            if (patch["from"].length != patch["to"].length) {
                return "from and to arrays must be of same length"
            }

            if (!typeof value == 'object') return "Expected Array or Object from the path"
            const value_type = Array.isArray(value) ? "array" : typeof value;

            for (let i = 0; i < patch["from"].length; i++) {
                const from = patch["from"][i]
                const to = patch["to"][i]
                if (typeof from == "string") {
                    if (value_type == "array") return "Expected type: integer as an index"
                    value[from] = to;
                }
                else if (typeof from == "number") {
                    if (value_type == "object") return "Expected type: string as a key"
                    value[from] = to;
                }
                else {
                    const schema = patch["from"][i]
                    const to = patch["to"][i]
                    if (value_type == "object") {
                        for (let key in value) {
                            if (v.validate(value[key], schema).errors.length == 0) {
                                console.log(key, value[key], schema);
                                value[key] = to
                            }
                        }
                    }
                    else if (value_type == "array") {
                        for (let i = 0; i < value.length; i++) {
                            if (v.validate(value[i], schema).errors.length == 0) {
                                value[i] = to
                            }
                        }
                    }
                }
            }
            obj = jsonpatch.applyPatch(obj, [{ "op": "replace", "path": patch["path"], "value": value }]).newDocument;

        }

        // move_all - (path, from - (takes regexes, schemas), to - (takes regexes, schemas))
        else if (patch["op"] == "move_all") {
            for (let i = 0; i < patch["from"].length; i++) {
                const from = patch["from"][i]
                const to = patch["to"][i]

                if (typeof from == "string") {
                    for (let key in value) {
                        if (key.match(from)) {
                            value = jsonpatch.applyPatch(value, [{ "op": "move", "path": "/" + key.replace(new RegExp(from, 'g'), to), "from": "/" + key }]).newDocument;
                        }
                    }
                }
                else if (typeof from == "object") {
                    for (let from_key in value) {
                        if (v.validate(value[from_key], from).errors.length == 0) {
                            for (let to_key in value) {
                                if (v.validate(value[to_key], to).errors.length == 0) {
                                    value = jsonpatch.applyPatch(value, [{ "op": "move", "path": "/" + to_key, "from": "/" + from_key }]).newDocument;
                                }
                            }
                        }
                    }

                }
            }
            obj = jsonpatch.applyPatch(obj, [{ "op": "replace", "path": patch["path"], "value": value }]).newDocument;
        }
        else {
            obj = jsonpatch.applyPatch(obj, [patch]).newDocument;
        }
    }
    return obj;
};


export default patchschema;
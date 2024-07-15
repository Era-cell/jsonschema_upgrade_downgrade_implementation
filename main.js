import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { frameAndGetReferences } from "./extract_refs.js";
import walker_2020 from './walkers/2020.json' assert { type: 'json' };
import { transform } from './transform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rulesDirectory = join(__dirname, 'rules', 'from-2019-09', 'to-2020-12');
const jsonFiles = readdirSync(rulesDirectory).filter(file => file.endsWith('.json'));

const rules = jsonFiles.map(file => {
    const filePath = join(rulesDirectory, file);
    return [JSON.parse(readFileSync(filePath, 'utf8')), file];
});

const schema = {
    "$schema": "https://json-schema.org/draft/2019-09/schema",
    "$id": "https://example.com",
    "properties":{
        "foola":{
            "$ref": "foo#/$defs/bar"
        },
        "barla":{
            "$ref": "#/properties/checkdeep/contains/items/0"
        },
        "checkdeep":{
            "contains": {
                "items": [ {} ]
            }
        }
    },
    "$defs":{
        "foo":{
            "$id": "foo",
            "type": "string",
            "$defs":{
                "bar":{
                    "$id": "bar",
                    "type": "integer"
                }
            }
        }
    },
    "allOf": [
        {}, 
        {},
        {"type": "array"}
    ]
}  

console.log("-----------------BEFORE----------------\n", JSON.stringify(schema, null, 2));

const response = await frameAndGetReferences(schema)

const {extractedRefs, locationRefs, fragmentRefs} = response;

// console.log(extractedRefs, fragmentRefs);
// parentURI, walker, schema, refs, extractedRefs, fragmentRefs, rules
const refs = [];
for(let ref of locationRefs){
    refs.push({ref_type: "ref_location", ref_id: ref, ref_correction_index:0});
}

transform(null, walker_2020, schema, refs, extractedRefs, fragmentRefs, rules)

for (let {ref_location, ref_fragment, ref_base_uri} of extractedRefs){
    let schemaToTweakRef = schema;
    for (let key of ref_location){
        schemaToTweakRef = schemaToTweakRef[key];
    }
    schemaToTweakRef["$ref"] = ref_base_uri + "#/" + ref_fragment.join("/")
}

console.log("-----------------AFTER----------------\n", JSON.stringify(schema, null, 2));
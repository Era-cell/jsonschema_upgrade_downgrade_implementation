import { main } from "./main.js";
import { frameAndGetReferences } from "./extract_refs.js";
import { readJsonFile } from "./utilities.js";
const tests = await readJsonFile('./full_schema_tests.json')

// const dialects = [  '2019-09', '2020-12' ];
const dialects = ['draft7', '2019-09'];
// const dialects = [ 'draft1', 'draft2', 'draft3', 'draft4', 'draft6', 'draft7', '2019-09', '2020-12' ];

// for (let i=0; i<dialects.length; i++){
//     if (i>0){
//         const [present, previous] = [dialects[i], dialects[i-1]]
//         console.log("Dialect--------------------------", previous, "---------to----------", present);
//         for (const schema of tests[previous]){
//             const references = await frameAndGetReferences(schema);
//             console.log(references);
//             await main(schema, previous, present, references);
//             console.log("After: ", JSON.stringify(schema, null, 2));
//         }
//     }
// }

async function transitive(schema,from,to){
    let dialects = [ 'draft1', 'draft2', 'draft3', 'draft4', 'draft6', 'draft7', '2019-09', '2020-12' ];
    if (from==to){
        return schema;
    }
    else{
        dialects = dialects.slice(dialects.indexOf(from), dialects.indexOf(to)+1)
        console.log(dialects);
        for (let i=0; i<dialects.length; i++){
            if (i>0){
                const [present, previous] = [dialects[i], dialects[i-1]]
                const references = await frameAndGetReferences(schema);
                console.log(present, schema);
                await main(schema, previous, present, references);
            }
        }
    }
}

const schema =    {
    "$schema": "http://json-schema.org/draft-03/schema#",
    "id": "http://example.com/v2",
    "properties": {
      "foo": {
        "disallow": [{}, "any", "string"],
        "$ref": "#/extends"
      },
      "jam": {
        "disallow": [{}, "any", "string"]
      },
      "bar": {
        "$ref": "#/properties/jam/disallow/0",
        "dependencies": {
          "foo": "bar"
        }
      },
      "nodefshere": {
        "id": "c2",
        "extends": [{ "type": "string" }, { "type": "number" }]
      }
    },
    "divisiblBy": 3,
    "extends": { "$ref": "c2#/extends/1" },
    "disallow": [{}]
  }

await transitive(schema, 'draft3', '2020-12');

console.log(JSON.stringify(schema, null, 2));
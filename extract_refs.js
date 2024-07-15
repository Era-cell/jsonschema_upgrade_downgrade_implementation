import data from './schema_framed.json' assert { type: 'json' };
import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { tmpdir } from 'os';

const cppjsonschemaLocation = 'D:/cpp-jsonschema/build/bin/Debug/jsonschema.exe'

// const references = data.references;
// const extractedRefs = [];

// // Ref store based on: location where it appeared and fragment
// const locationRefs = [];
// const fragmentRefs = {};

// let i = 0;
// for (let location_in_schema of Object.keys(references)) {
//     const ref_info = references[location_in_schema];
//     if (ref_info.hasOwnProperty("fragment")) {
//         const ref = {
//             "location": location_in_schema.split("/").splice(1),
//             "ref_fragment": ref_info["fragment"].split("/").splice(1),
//             "ref_base_uri": ref_info["fragmentBaseURI"]
//         };

//         locationRefs.push(i);

//         if (!fragmentRefs[ref["ref_base_uri"]]) {
//             fragmentRefs[ref["ref_base_uri"]] = [];
//         }
//         fragmentRefs[ref["ref_base_uri"]].push(i);

//         extractedRefs.push(ref);
//         i++;
//     }
// }

const extractReferences = (data) => {
    const references = data.references;
    const extractedRefs = [];

    // Ref store based on: location where it appeared and fragment
    const locationRefs = [];
    const fragmentRefs = {};
    let i = 0;
    for (let location_in_schema of Object.keys(references)) {
        const ref_info = references[location_in_schema];
        if (ref_info.hasOwnProperty("fragment")) {
            const splittedLocationPath = location_in_schema.split("/")
            const ref = {
                "ref_location": splittedLocationPath.slice(1, splittedLocationPath.length - 1),
                "ref_fragment": ref_info["fragment"].split("/").slice(1),
                "ref_base_uri": ref_info["base"]
            };

            locationRefs.push(i);

            if (!fragmentRefs[ref["ref_base_uri"]]) {
                fragmentRefs[ref["ref_base_uri"]] = [];
            }
            fragmentRefs[ref["ref_base_uri"]].push(i);

            extractedRefs.push(ref);
            i++;
        }
    }

    return {
        // all references and their locations 
        extractedRefs,

        // these store indexes of extracted refs (indexes acting as id's)
        locationRefs,
        fragmentRefs
    };
};

const frameSchema = async (schema) => {
    const tempDir = tmpdir();
    const schemaPath = join(tempDir, 'temp_schema.json');

    // Write schema to temporary file
    await fs.writeFile(schemaPath, JSON.stringify(schema));

    return new Promise((resolve, reject) => {
        const command = `"${cppjsonschemaLocation}" frame "${schemaPath}" --json`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing command: ${stderr}`);
                return;
            }
            try {
                const framedSchema = JSON.parse(stdout);
                resolve(framedSchema);
            } catch (parseError) {
                reject(`Error parsing output: ${parseError.message}`);
            }
        });
    });
};

const frameAndGetReferences = async (schema) => {
    try {
        const framedSchema = await frameSchema(schema);
        const references = extractReferences(framedSchema);
        // console.log('Extracted References:', JSON.stringify(references));
        return references;
    } catch (error) {
        console.error('Error processing schema:', error);
    }
};

// Example usage
const exampleSchema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://example.com/product",
    "type": "object",
    "properties": {
        "foo": {
            "$id": "httsp://example.com/subahnalla",
            "items":{
                "$ref": "https://example.com/product#/properties/bar"
            }
        },
        "bar": {
            "$ref": "subahnalla"
        }
    }
};

export{ 
    frameAndGetReferences
}

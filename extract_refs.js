import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { tmpdir } from 'os';

const cppjsonschemaLocation = 'jsonschema.exe';

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

const getAnchors = (frames) =>{
    const anchors = {};
    for(let key of Object.keys(frames)){
        if(frames[key]["type"]=="anchor"){
            const anchor_fragment = key.split("#")[1];
            anchors[anchor_fragment]= frames[key]["pointer"].split("/").slice(1);
        }
    }
    return anchors;
}

const extractReferences = (extractedData) => {
    const frames = extractedData.frames;
    const anchors = getAnchors(frames);
    const references = extractedData.references;
    const extractedRefs = [];
    // console.log(references);
    // Ref store based on: location where it appears 
    const locationRefs = [];
    // index in extracted refs for given base URI
    const fragmentRefs = {};
    // anchor: location where its present
    const anchorRefs = {};
    let extractedRefIndex = 0;
    for (let location_in_schema of Object.keys(references)) {
        const ref_info = references[location_in_schema];
        if (ref_info.hasOwnProperty("fragment") && ref_info["fragment"]!=null) {
            const splittedLocationPath = location_in_schema.split("/")

            if (ref_info["fragment"][0]!="/"){
                anchorRefs[ref_info["fragment"]] = splittedLocationPath.slice(1);
            }else{
                const ref = {
                    "ref_location": splittedLocationPath.slice(1, splittedLocationPath.length - 1),
                    "ref_fragment": ref_info["fragment"].split("/").slice(1),
                    "ref_base_uri": ref_info["base"]
                };

                locationRefs.push(extractedRefIndex);
    
                if (!fragmentRefs[ref["ref_base_uri"]]) {
                    fragmentRefs[ref["ref_base_uri"]] = [];
                }
                fragmentRefs[ref["ref_base_uri"]].push(extractedRefIndex);
    
                extractedRefs.push(ref);
                extractedRefIndex++;
            }
        }
    }
    return {
        // all references and their locations 
        extractedRefs,

        // these store indexes of extracted refs (indexes acting as id's)
        locationRefs,
        fragmentRefs,
        anchors,
        anchorRefs,
        frames
    };
};

const frameAndGetReferences = async (schema) => {
    try {
        const framedSchema = await frameSchema(schema);
        const frames_and_references = extractReferences(framedSchema);
        // console.log('Extracted References:', JSON.stringify(references));
        console.log(frames_and_references.anchorRefs);
        return frames_and_references;
    } catch (error) {
        console.error('Error processing schema:', error);
    }
};

export{ 
    frameAndGetReferences
}

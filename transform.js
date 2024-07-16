import { applyRule } from "./apply.js";
import { URL } from 'url';
import { deepEqual } from "./utilities.js";
import { checkCondition } from './checkschema.js';
import { log } from "console";

const normaliseAndSetParent  = (parentBaseURI, newId) =>{
    if (parentBaseURI==null) return newId;
    // Create a base URL from the parentBaseURI
    const baseUrl = new URL(parentBaseURI);

    // Create a new URL using the base URL and the newId
    const resolvedUrl = new URL(newId, baseUrl);

    return resolvedUrl.href;
}

const filterAndCorrectRefs = (refs, extractedRefs, oldWalk, newWalk) => {
    const filteredRefs = [];
    // console.log("-----------CURRENT-----------------");
    // console.log("refs Before: ", refs, oldWalk, newWalk);
    for(let {ref_type, ref_id, ref_correction_index} of refs){
        const {ref_location, ref_fragment, ref_base_uri} = extractedRefs[ref_id];
        // console.log(ref_id, ref_location, ref_fragment, ref_base_uri);

        // ref type is location
        if (ref_type=="ref_location" && ref_correction_index+oldWalk.length <= ref_location.length && deepEqual(ref_location.slice(ref_correction_index, ref_correction_index + oldWalk.length), oldWalk)){
            extractedRefs[ref_id]["ref_location"].splice(ref_correction_index, oldWalk.length, ...newWalk)
            filteredRefs.push({ref_type: "ref_location", ref_id: ref_id, ref_correction_index: ref_correction_index + newWalk.length});
        }
        // ref type is fragment
        else if(ref_correction_index+oldWalk.length <= ref_fragment.length && deepEqual(ref_fragment.slice(ref_correction_index, ref_correction_index + oldWalk.length),oldWalk)){
            extractedRefs[ref_id]["ref_fragment"].splice(ref_correction_index, oldWalk.length, ...newWalk)
            filteredRefs.push({ref_type: "ref_fragment", ref_id: ref_id, ref_correction_index: ref_correction_index + newWalk.length});
        }
    }

    // console.log("After filter: ", filteredRefs);
    return filteredRefs;
}

const extractAllWalks = (schema, walker) =>{
    const allWalks = [];
    for(const keyword of Object.keys(schema)){
        // not a walkable subscehma 
        if (!(keyword in walker)) continue;
        let walk_type = "unknown";
        if(Array.isArray(walker[keyword].type)){
            for(let {type, conditions} of walker[keyword].type){
                if (conditions.every((condition)=>(checkCondition(condition, schema)))){
                    walk_type = type;
                    break;
                }
            }
        }else walk_type = walker[keyword].type;

        if(walk_type=="array"){
            for(let i=0; i<schema[keyword].length; i++){
                const walk = {oldWalk: [keyword, i], newWalk: [keyword, i]}
                allWalks.push(walk);
            }
        }
        else if(walk_type=="object"){
            for (const property of Object.keys(schema[keyword])){
                const walk = {oldWalk: [keyword, property], newWalk: [keyword, property]}
                allWalks.push(walk);
            }
        }else if(walk_type=="value"){
            const walk = {oldWalk: [keyword], newWalk: [keyword]}
            allWalks.push(walk);
        }
    }
    return allWalks;
}

const transform = (parentURI, walker, schema, refs, extractedRefs, fragmentRefs, rules, wwl) =>{
    // console.log("Schema in recursion: ", schema, wwl);

    // change parent URI if $id is present
    if (schema.hasOwnProperty("$id")){
        const temp = parentURI;
        parentURI = normaliseAndSetParent(parentURI, schema["$id"]);
        // console.log("Parent URI resolve Before & After: ", temp, parentURI);
        // console.log("------------ CURRENT--------------");
        // console.log("Fragment refs:", fragmentRefs);
        // spawn the refs to be corrected:
        if (fragmentRefs.hasOwnProperty(parentURI)){
            for(const id of fragmentRefs[parentURI]){
                refs.push({ref_type: "ref_fragment", ref_id: id, ref_correction_index: 0});
            }
        }
        // console.log("after spawning:", refs);
    }

    // extract all walks:
    const allWalks = extractAllWalks(schema, walker);

    // for every rule:
    for (const [rule, rule_name] of rules) {
        applyRule(schema, rule, allWalks);
    }

    // traverse the schema with filter down the refs using the walker and walk
    // console.log(allWalks);
    for(const {oldWalk, newWalk} of allWalks){
        const newRefs = filterAndCorrectRefs(refs, extractedRefs, oldWalk, newWalk);
        // console.log("New Refs: ", newRefs);

        let subschema = schema;
        for (const key of newWalk) {
            subschema = subschema[key];
            if (!subschema) break; // Exit if subschema is not found
        }

        transform(parentURI, walker, subschema, newRefs, extractedRefs, fragmentRefs, rules, newWalk);
    }
}

export {
    transform
}
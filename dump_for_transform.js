// for(const keyword of Object.keys(schema)){
//     // not a walkable subscehma 
//     if (!(keyword in walker)) continue;

//     console.log("Key: ----",keyword);
//     if(walker[keyword].type=="array"){
//         for(let i=0; i<schema[keyword].length; i++){
//             const filteredRefs  = filterRefs(refs, extractedRefs, [keyword, i]);
//             transform(parentURI, walker, schema[keyword][i], filteredRefs, extractedRefs, fragmentRefs, rules);
//         }
//     }
//     else if(walker[keyword].type=="object"){
//         for (const property of Object.keys(schema[keyword])){
//             const filteredRefs  = filterRefs(refs, extractedRefs, [keyword, property]);
//             console.log([keyword, property]);
//             transform(parentURI, walker, schema[keyword][property], filteredRefs, extractedRefs, fragmentRefs, rules);
//         }
//     }else{
//         const filteredRefs  = filterRefs(refs, extractedRefs, [keyword]);
//         transform(parentURI, walker, schema[keyword], filteredRefs, extractedRefs, fragmentRefs, rules);
//     }
// }

// ------------------------------------------------------------------------------------------
// side effects of the transform on the references
// for every ref mapping which tweaked
// for(let {ref_type, ref_id, ref_correction_index} of refs){
//     const {ref_location, ref_fragment, ref_base_uri} = extractedRefs[ref_id];

//     // ref type is location
//     if (ref_type=="ref_location"){
//         for(let {oldWalk, newWalk} of tweakedWalks){
//             if (oldWalk[0]==ref_location[ref_correction_index]){
//                 ref_location.splice(ref_correction_index, oldWalk.length, ...newWalk)
//             }
//         }
//     }

//     // ref type is fragment
//     else{
//         for(let {oldWalk, newWalk} of tweakedWalks){
//             if (oldWalk[0]==ref_fragment[ref_correction_index]){
//                 ref_fragment.splice(ref_correction_index, oldWalk.length, ...newWalk)
//             }
//         }
//     }
// }
// console.log(extractedRefs);


const schema = {
    "$id": "http://exumple.com/foo",
    "contains": {},
    "maxContains": 3,
    "allOf": [{},{}],
    "items": [{"type": "string"}],
    "additionalItems": {}
}

const rule = {
    "vocabulary": [
        "https://json-schema.org/draft/2019-09/vocab/applicator",
        "https://json-schema.org/draft/2019-09/vocab/validation"
    ],
    "condition": [ 
        { "operation": "has-key", "path": [], "value": "contains" },
        { "operation": "has-key", "path": [], "value": "maxContains" },
        { "operation": "not-has-key", "path": [], "value": "minContains" },
        { "operation": "has-key", "path": [], "value": "allOf" }
    ],
    "transform": [
        { "operation": "add", "path": [ "allOf" , "-"], "value": { "not": { "not": { "contains": "temp" } } } },
        { "operation": "move", "to": [ "allOf" , "-", "not", "not", "contains" ], "from": [ "contains" ] },
        { "operation": "move", "to": [ "allOf" , "-", "not", "not", "maxContains" ], "from": [ "maxContains" ] }
    ]
}
const tweakedWalks = applyRule(schema, rule);

// console.log(tweakedWalks);

// // console.log(schema);
// console.log(normaliseAndSetParent(null, schema["$id"]));

console.log(allWalks);

// tweakedWalks.push(...applyRule(schema, rule, allWalks));

// for (const walk of allWalks){
//     for(const {oldWalk, newWalk} of tweakedWalks){
//         if (deepEqual(walk.oldWalk, oldWalk)){
//             walk.newWalk = newWalk;
//         }
//     }
// }
// console.log("---walks-----");
// console.log(JSON.stringify(allWalks), JSON.stringify(tweakedWalks));
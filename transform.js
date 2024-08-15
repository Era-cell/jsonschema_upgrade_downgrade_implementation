import { applyRule } from "./apply.js";
import { deepEqual } from "./utilities.js";
import { checkCondition, checkType } from "./checkschema.js";

const normaliseAndSetParent = (parentBaseURI, newId) => {
  if (parentBaseURI == null) return newId;
  // Create a base URL from the parentBaseURI
  const baseUrl = new URL(parentBaseURI);

  // Create a new URL using the base URL and the newId
  const resolvedUrl = new URL(newId, baseUrl);

  return resolvedUrl.href;
};

const filterAndCorrectRefs = (refs, extractedRefs, oldWalk, newWalk) => {
  // console.log("Filter: ----------------> ", oldWalk, newWalk,  "\n");
  // console.log(refs);
  const filteredRefs = [];
  for (let { ref_type, ref_id, ref_correction_index } of refs) {
    const { ref_location, ref_fragment, ref_base_uri } = extractedRefs[ref_id];
    if (
      ref_type == "ref_location" &&
      ref_correction_index + oldWalk.length <= ref_location.length &&
      deepEqual(
        ref_location.slice(
          ref_correction_index,
          ref_correction_index + oldWalk.length
        ),
        oldWalk
      )
    ) {
      extractedRefs[ref_id]["ref_location"].splice(
        ref_correction_index,
        oldWalk.length,
        ...newWalk
      );
      filteredRefs.push({
        ref_type: "ref_location",
        ref_id: ref_id,
        ref_correction_index: ref_correction_index + newWalk.length,
      });
    } else if (
      ref_type == "ref_fragment" &&
      ref_correction_index + oldWalk.length <= ref_fragment.length &&
      deepEqual(
        ref_fragment.slice(
          ref_correction_index,
          ref_correction_index + oldWalk.length
        ),
        oldWalk
      )
    ) {
      extractedRefs[ref_id]["ref_fragment"].splice(
        ref_correction_index,
        oldWalk.length,
        ...newWalk
      );
      filteredRefs.push({
        ref_type: "ref_fragment",
        ref_id: ref_id,
        ref_correction_index: ref_correction_index + newWalk.length,
      });
    }
  }
  // console.log(filteredRefs);
  return filteredRefs;
};

const extractAllWalks = (schema, walker, from) => {
  if (from == "draft7" && schema.hasOwnProperty("$ref")) return [];
  const allWalks = [];
  for (const keyword of Object.keys(schema)) {
    if (!(keyword in walker)) continue;
    let walk_type = "unknown";
    if (Array.isArray(walker[keyword].type)) {
      for (let { type, conditions } of walker[keyword].type) {
        if (
          conditions.every((condition) => checkCondition(condition, schema))
        ) {
          walk_type = type;
          break;
        }
      }
    } else walk_type = walker[keyword].type;

    if (walk_type == "array") {
      for (let i = 0; i < schema[keyword].length; i++) {
        const walk = { oldWalk: [keyword, i], newWalk: [keyword, i] };
        allWalks.push(walk);
      }
    } else if (walk_type == "object") {
      for (const property of Object.keys(schema[keyword])) {
        const walk = {
          oldWalk: [keyword, property],
          newWalk: [keyword, property],
        };
        allWalks.push(walk);
      }
    } else if (walk_type == "value") {
      const walk = { oldWalk: [keyword], newWalk: [keyword] };
      allWalks.push(walk);
    }
  }
  return allWalks;
};

const transform = (
  parentURI,
  walker,
  schema,
  refs,
  extractedRefs,
  fragmentRefs,
  rules,
  from
) => {
  if (!checkType(schema, "array") && !checkType(schema, "object")) return;
  // console.log("SubSchema: \n",schema,);
  if (schema.hasOwnProperty("$id") || schema.hasOwnProperty("id")) {
    if (schema.hasOwnProperty("$id"))
      parentURI = normaliseAndSetParent(parentURI, schema["$id"]);
    if (schema.hasOwnProperty("id"))
      parentURI = normaliseAndSetParent(parentURI, schema["id"]);
    if (fragmentRefs.hasOwnProperty(parentURI)) {
      for (const id of fragmentRefs[parentURI]) {
        refs.push({
          ref_type: "ref_fragment",
          ref_id: id,
          ref_correction_index: 0,
        });
      }
    }
    // console.log(from, refs, parentURI, "\n Extracted refs: \n", extractedRefs);
  }
  const allWalks = extractAllWalks(schema, walker, from);

  for (const [rule_name, rule] of rules) {
    applyRule(schema, rule, allWalks);
  }
//   console.log("Inside transform:----->", schema, refs, allWalks);
  // console.log("After applying rule, Extracted refs: \n",parentURI, refs, extractedRefs);
  for (const { oldWalk, newWalk } of allWalks) {
    const newRefs = filterAndCorrectRefs(refs, extractedRefs, oldWalk, newWalk);

    let subschema = schema;
    for (const key of newWalk) {
      subschema = subschema[key];
      if (!subschema) break;
    }

    transform(
      parentURI,
      walker,
      subschema,
      newRefs,
      extractedRefs,
      fragmentRefs,
      rules,
      [oldWalk, newWalk]
    );
  }
};

export { transform };

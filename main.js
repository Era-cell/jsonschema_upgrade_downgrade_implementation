import { transform } from "./transform.js";
import { deepGet, readJsonFile } from "./utilities.js";
import { frameAndGetReferences } from "./extract_refs.js";
import { checkType } from "./checkschema.js";
import { operations } from "./patchschema.js";

let ruleFiles = await readJsonFile("ruleFiles.json");

const extractRules = async (from, to) => {
  const rules = [];
  const ruleFile = ruleFiles[`${from}_to_${to}`];

  for (let file of ruleFile) {
    // TODO: dynamic import properly
    // const rulesJson = await readJsonFile(`./rules/from-${from}/to-${to}`);
    const ruleJson = await readJsonFile(file);
    rules.push([file, ruleJson]);
  }
  return rules;
};

function processReferencePaths(schema, pathArray, subschemaLocation = []) {
  let tempSchema = deepGet(schema, subschemaLocation);
  let i = 0;
  while (i < pathArray.length) {
    const key = pathArray[i];
    if (Array.isArray(tempSchema[key])) {
      pathArray[i + 1] = parseInt(pathArray[i + 1]);
      tempSchema = tempSchema[key][pathArray[i + 1]];
      i += 2;
    } else {
      tempSchema = tempSchema[key];
      i += 1;
    }
  }
  return tempSchema;
}

const removeColonAnchors = (schema, anchors, anchorRefs) => {
  for (let anchor of Object.keys(anchors)) {
    if (anchor.includes(":")) {
      const anchorPath = anchors[anchor];
      const anchorSubSchema = deepGet(schema, anchorPath);
      let newAnchor = anchor.split(":").join("");
      while(anchors[newAnchor]){
        newAnchor = "x-" + newAnchor;
      }
      anchorSubSchema["$anchor"] = newAnchor;
      if (anchorRefs && anchorRefs[anchor]) {
        const anchorRefPath = anchorRefs[anchor];
        const anchorRefSubSchema = deepGet(
          schema,
          anchorRefPath.slice(0, anchorRefPath.length - 1)
        );
        const baseURI = anchorRefSubSchema["$ref"].split("#")[0];
        anchorRefSubSchema["$ref"] = baseURI + "#" + newAnchor;
      }
    }
  }
};

export const main = async (schema, from, to, references) => {
  const walker = await readJsonFile(`./walkers/${from}.json`);
  const {
    extractedRefs,
    locationRefs,
    fragmentRefs,
    anchors,
    anchorRefs,
    frames,
  } = references;
  // console.log(extractedRefs);
  if (from == "2019-09") {
    removeColonAnchors(schema, anchors, anchorRefs);
  }
  // console.log(frames, extractedRefs);

  for (const ref of extractedRefs) {
    processReferencePaths(schema, ref.ref_location);
    processReferencePaths(
      schema,
      ref.ref_fragment,
      frames[ref.ref_base_uri].pointer.split("/").slice(1)
    );
  }

  // preprocess and collect ref locations(i.e, location in schema)
  const refs = [];
  for (let ref of locationRefs) {
    refs.push({
      ref_type: "ref_location",
      ref_id: ref,
      ref_correction_index: 0,
    });
  }

  // console.log("refs", refs);

  const rules = await extractRules(from, to);

  // console.log("-----------------BEFORE----------------\n", JSON.stringify(schema, null, 2));

  transform(
    null,
    walker,
    schema,
    refs,
    extractedRefs,
    fragmentRefs,
    rules,
    from
  );
  // console.log(extractedRefs);
  for (let { ref_location, ref_fragment, ref_base_uri } of extractedRefs) {
    // to tweak ref based on changes
    let locationOfRefSchema = schema;
    for (let key of ref_location) {
      locationOfRefSchema = locationOfRefSchema[key];
    }
    if (from == "draft4") {
      const pointerOfRefResolves = frames[ref_base_uri]["pointer"]
        .split("/")
        .slice(1)
        .concat(ref_fragment);
      const locationRefResolves = deepGet(schema, pointerOfRefResolves);
      console.log(
        "location ref resolves",
        locationRefResolves,
        pointerOfRefResolves,
        checkType(locationRefResolves)
      );
      if (
        checkType(locationRefResolves, "object") ||
        checkType(locationRefResolves, "boolean")
      ) {
        locationOfRefSchema["$ref"] =
          locationOfRefSchema["$ref"].split("#")[0] +
          "#/" +
          ref_fragment.join("/");
      } else {
        operations["move"](schema, {
          from: pointerOfRefResolves,
          to: ref_location,
        });
      }
    } else {
      locationOfRefSchema["$ref"] =
        locationOfRefSchema["$ref"].split("#")[0] +
        "#/" +
        ref_fragment.join("/");
    }
  }
  if (from=='draft1'){
    schema['$schema'] =  "http://json-schema.org/draft-02/schema#";
  }
  else if (from=='draft2'){
    schema['$schema'] =  "http://json-schema.org/draft-03/schema#";
  }
  return schema;
};

const DEFAULT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2019-09/schema",
  $id: "https://example.com",
  properties: {
    foola: {
      $ref: "https://example.com/bar#ba:r",
    },
    barla: { $ref: "/bar#/contains" },
  },
  $anchor: "fo:rr",
  contains: { type: "boolean" },
  $defs: {
    foo: {
      $id: "foo",
      type: "string",
      $defs: {
        bar: {
          $anchor: "ba:r",
          $id: "bar",
          type: "integer",
          contains: { "$anchor": "bar" },
        },
      },
    },
  },
  allOf: [{}, {}, { type: "array" }],
  items: [{ type: "number" }],
  additionalItems: {},
  prefixItems: "hello",
};

// console.log(
//   JSON.stringify(
//     await main(
//       DEFAULT_SCHEMA,
//       "2019-09",
//       "2020-12",
//       await frameAndGetReferences(DEFAULT_SCHEMA)
//     ),
//     null,
//     2
//   )
// );

import { deepGet, deepEqual, deepCopy } from "./utilities.js";
import { operations } from "./patchschema.js";
import { checkCondition } from "./checkschema.js";

// Function to check if an object is empty
function hasEmptyObject(path) {
  return path.some(
    (item) =>
      item && Object.keys(item).length === 0 && item.constructor === Object
  );
}

const getIterables = (schema, conditions) => {
  let iterative_indices = [null];
  for (let i = 0; i < conditions.length; i++) {
    const path = conditions[i]["path"];
    if (hasEmptyObject(path)) {
      const iterativeSchema = deepGet(schema, path.slice(0, path.indexOf({})));
      if (iterativeSchema === undefined) return [];
      if (Array.isArray(iterativeSchema))
        iterative_indices = Array.from(
          { length: iterativeSchema.length },
          (_, i) => iterativeSchema.length - 1 - i
        );
      else iterative_indices = Object.keys(iterativeSchema);
      break;
    }
  }
  return iterative_indices;
};

const getProcessedPath = (path, iterableKey) => {
  const processed_path = [];
  for (const p of path) {
    if (typeof p === "object") processed_path.push(iterableKey);
    else processed_path.push(p);
  }
  return processed_path;
};

const applyRule = (schema, rule, allWalks) => {
  const conditions = rule.condition;
  const transforms = rule.transform;

  const allIndices = getIterables(schema, conditions);
  const iterableIndices = [];
  for (const index of allIndices) {
    let conditionAgrees = true;
    for (const condition of conditions) {
      // path: ["properties", {}]  --> path: ["properties", foo] for1st iterableKey and so on
      const processed_path = getProcessedPath(condition["path"], index);
      if (
        !checkCondition(
          {
            operation: condition.operation,
            path: processed_path,
            value: condition.value,
          },
          schema
        )
      ) {
        conditionAgrees = false;
        break;
      }
    }
    if (conditionAgrees) iterableIndices.push(index);
  }
//   console.log(schema, iterableIndices);
  for (const iterableKey of iterableIndices) {
    // console.log("------------\n", schema, iterableKey);
    for (const transform of transforms) {
      // console.log(transform, schema);
      if (transform.hasOwnProperty("path")) {
        const temp = [...transform["path"]];
        transform["path"] = getProcessedPath(transform["path"], iterableKey);
        const { operation, ...params } = transform;
        operations[operation](schema, params);
        transform["path"] = temp;
      } else {
        const temp_from = [...transform["from"]];
        const temp_to = [...transform["to"]];
        transform["from"] = getProcessedPath(transform["from"], iterableKey);
        transform["to"] = getProcessedPath(transform["to"], iterableKey);
        const { operation, ...params } = transform;
        operations[operation](schema, params);
        if (transform.operation == "remove-and-append") {
          processTransformWalk(
            schema,
            transform["from"],
            transform["to"].concat([
              deepGet(schema, transform["to"]).length - 1,
            ]),
            allWalks
          );
        } else {
          processTransformWalk(
            schema,
            transform["from"],
            transform["to"],
            allWalks
          );
        }
        transform["from"] = temp_from;
        transform["to"] = temp_to;
      }

      // console.log(iterableKey, schema);
    }
  }
};

const processTransformWalk = (schema, from_path, to_path, allWalks) => {
  let temp_schema = deepCopy(schema);
  for (let i = 0; i < to_path.length; i++) {
    if (to_path[i] === "-" && Array.isArray(temp_schema)) {
      to_path[i] = temp_schema.length - 1;
    }
    temp_schema = temp_schema[to_path[i]];
  }
  // Assuming the rules wil always have thier "from" length less than or equal to walks
  // this violated type: [{},"string"] because type/0 will be transformed, latereven type/0 which resolves to "string" too will be
  // so reverting to from's length equals old walk
  for (let i in allWalks) {
    // This is a lock (for now), once changed again can't be changed: Solving /items -> /prefixItems along with above
    if (
      deepEqual(allWalks[i].newWalk, allWalks[i].oldWalk) &&
      from_path.every((val, index) => allWalks[i].oldWalk[index] == val)
    ) {
      allWalks[i].newWalk = to_path.concat(
        allWalks[i].oldWalk.slice(from_path.length)
      );
      break;
    }
  }

  // for (let i in allWalks) {
  //     if (from_path.every((val, index)=>allWalks[i].oldWalk[index]==val)) {
  //         allWalks[i].newWalk = to_path.concat(allWalks[i].oldWalk.slice(from_path.length));
  //         break;
  //     }
  // }
};
const rule = {
  vocabulary: "core",
  condition: [
    { operation: "has-key", path: [], value: "properties" },
    { operation: "has-key", path: ["properties", {}], value: "optional" },
    { operation: "equals", path: ["properties", {}, "optional"], value: false },
    { operation: "not-has-key", path: ["properties", {}], value: "required" },
  ],
  transform: [
    {
      operation: "move",
      to: ["properties", {}, "required"],
      from: ["properties", {}, "optional"],
    },
    { operation: "replace", path: ["properties", {}, "required"], value: true },
  ],
};

const schema = {
  properties: {
    booo: {
      optional: false,
      "x-required": "hello",
      requires: {
        type: "boolean",
      },
    },
  },
};
applyRule(schema, rule);
console.log(schema);

export { applyRule };

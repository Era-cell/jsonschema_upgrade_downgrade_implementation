const checkType = (subject, predicate) => {
    if (Array.isArray(predicate)) {
        // Handle the "array" type explicitly
        if (predicate.includes("array") && Array.isArray(subject)) {
            return true;
        }
        // Check if the type of the subject matches any type in the predicate array
        if (!predicate.some((type) => typeof subject === type)) {
            return false;
        }
    } else if (typeof predicate === "string") {
        // Handle the "array" type explicitly
        if (predicate === "array" && Array.isArray(subject)) {
            return true;
        }
        
        if ( predicate === "object" && Array.isArray(subject) ) return false;

        if (typeof subject !== predicate) {
            return false;
        }
    }
    return true;
};

const extractMatchingValues = (subject, predicate) => {
    const result = [];
    const pattern = new RegExp(predicate);

    for (const key in subject) {
        if (pattern.test(key)) {
            result.push(subject[key]);
        }
    }

    return result;
};

const extractValues = (schema, condition) => {
    // console.log(schema, condition);
    let values = [];

    // Check if "key" exists in the condition
    if (condition.hasOwnProperty("key")) {
        // Check if there's a pattern inside the "key" property
        if (typeof condition.key === 'object' && condition.key.hasOwnProperty('pattern')) {
            values = extractMatchingValues(schema, condition.key.pattern);
        } else {
            // Use the key to get the value directly from the schema
            values.push(schema[condition["key"]]);
        }
    } else {
        // If "key" does not exist in the condition
        if (Array.isArray(schema)) {
            // If schema is an array, take all values
            values = schema;
        } else {
            // If schema is an object, take all object values
            values = Object.values(schema);
        }
    }

    return values;
};

const matchschema = (schema, conditions, anyOf=false) => {
    for (let condition of conditions){

        let result = true;
        // schema is an object
        if (condition.hasOwnProperty("key")){
            if (typeof condition["key"]=="string" && !schema.hasOwnProperty(condition["key"])) result = false;
            else{
                if (condition["key"].hasOwnProperty("pattern") && extractMatchingValues(schema, condition["pattern"]).length==0) result = false; 
            }
        }
                
        if (condition.hasOwnProperty("type") && !checkType(schema, condition["type"])) result = false;
        
        if (condition.hasOwnProperty("value")){
            let value_constraints = condition["value"];

            let values = extractValues(schema, condition);
            if (!values.some((value) => {
                //  key of object too when type:obejct is true
                if (value_constraints.hasOwnProperty("key")){
                    if (typeof value_constraints["key"]=="string" && !value.hasOwnProperty(value_constraints["key"])) return false;
                    else{
                        if (value_constraints["key"].hasOwnProperty("pattern") && extractMatchingValues(value, value_constraints["pattern"]).length==0) return false; 
                    }
                }

                if (value_constraints.hasOwnProperty("type") && !checkType(value, value_constraints["type"])) return false;

                if (value_constraints.hasOwnProperty("const") && value!=value_constraints["const"]) return false;
                if (value_constraints.hasOwnProperty("pattern") && !value.match(value_constraints["pattern"])) return false;
                // enum
                if (value_constraints.hasOwnProperty("has") && !matchschema(value, value_constraints["has"])) return false;
                if (value_constraints.hasOwnProperty("hasAnyOf") && !matchschema(value, value_constraints["hasAnyOf"], anyOf=true)) return false;
                
                if (Array.isArray(value) && value_constraints.hasOwnProperty("minItems") && value.length<value_constraints["minItems"]) result = false;
                if (Array.isArray(value) && value_constraints.hasOwnProperty("maxItems") && value.length>value_constraints["maxItems"]) result = false;
                
                if (typeof value=="object" && !Array.isArray(value) && value_constraints.hasOwnProperty("minProperties") && Object.values(value).length<value_constraints["minProperties"]) result = false;
                if (typeof value=="object" && !Array.isArray(value) && value_constraints.hasOwnProperty("maxProperties") && Object.values(value).length>value_constraints["maxProperties"]) result = false;
         

                // implement "not" in the values or maybe absent
                return true;
            })) result = false;
        }
        if (Array.isArray(schema) && condition.hasOwnProperty("minItems") && schema.length<condition["minItems"]) result = false;
        if (Array.isArray(schema) && condition.hasOwnProperty("maxItems") && schema.length>condition["maxItems"]) result = false;
        
        if (typeof schema=="object" && !Array.isArray(schema) && condition.hasOwnProperty("minProperties") && Object.values(schema).length<condition["minProperties"]) result = false;
        if (typeof schema=="object" && !Array.isArray(schema) && condition.hasOwnProperty("maxProperties") && Object.values(schema).length>condition["maxProperties"]) result = false;
        
        if (typeof schema=="number" && condition.hasOwnProperty("multipleOf") && schema/condition["multipleOf"]!=0) result = false;
        if (condition.hasOwnProperty("const") && schema !== condition["const"]) result = false;
        if (condition.hasOwnProperty("pattern") && !schema.match(condition["pattern"])) result = false;
        // enum
        // if (condition.hasOwnProperty("has") && !matchschema(schema[keyword], condition["has"])) result = false;
        // if (condition.hasOwnProperty("absent") && condition["absent"] === true && schema.hasOwnProperty(condition["absent"])) result = false;

        if (condition.hasOwnProperty("not") && condition["not"]==true && result==true) result = false;
        else if (condition.hasOwnProperty("not") && condition["not"]==true && result==false) result = true;
        // for anyOf what if first one is false and second one true, so collect results
        if (result==false) return false;
        if (anyOf) return true;
    }
    return true
}

export {matchschema};
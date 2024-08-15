import { applyRule } from './apply.js';
import { readJsonFile, deepEqual } from './utilities.js';
// read the folder test
import fs from 'fs';
import path from 'path';
const testRootFolder = './test';
const rulesRootFolder = './rules';
// also read rules and for respective folder 2029 in test and 2019 in rules apply test in each using rules in rules

const dialects = [ 'draft1', 'draft2', 'draft3', 'draft4', 'draft6', 'draft7', '2019-09', '2020-12' ];
// const dialects = ['draft2', 'draft3'];

for (let i=0; i<dialects.length; i++){
    if (i>0){
        const [present, previous] = [dialects[i], dialects[i-1]]
        const presentRulesDir = rulesRootFolder + '/from-' + previous + '/to-'+ present;
        const presentTestDir = testRootFolder + '/from-'+ previous +'/to-'+present;
        const rules = fs.readdirSync(presentRulesDir);
        const tests = fs.readdirSync(presentTestDir);

        // for each test file
        for (const test of tests){
            // apply test
            // take the json from test dir and iterate over each test
            fs.readFile(presentTestDir+"/"+test, 'utf8', async (err, data) => {
                if (err) {
                  console.error('Error reading file:', err);
                  return;
                }
                const jsonData = JSON.parse(data);
                
                for (const test_case of jsonData){
                    // console.log(test_case, rule, "-----------");
                    // TODO: pass all rules directly
                    // console.log(test_case);
                    console.log(await applyTest(test_case, rules, presentRulesDir), test_case["title"]);
                    if (test_case["title"]==undefined){
                        console.log(present, previous, test_case, test);
                    }
                    // if (test_case["title"]==undefined){
                    //     console.log("Hi-------------------------------", test_case["title"]);}
                    // if (result !== true){
                    //     console.log("Test failed for test case:", test_case["title"]);
                    // }
                }

              });

        }
        

    }
    if (i<dialects.length){

    }
}

const applyTest = async (test, rules, presentRulesDir) => {
    const from = test["from"];
    // console.log("From", from);
    for (let rule of rules){
        rule = await readJsonFile(path.join(presentRulesDir, rule));
        applyRule(from, rule);

    }
    // console.log("Result:", from);
    return deepEqual(from, test["to"]);
}

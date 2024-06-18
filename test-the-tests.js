import { applyTest } from './apply.js';
import { readJsonFile } from './utilities.js';
// read the folder test
import fs from 'fs';
import path from 'path';
const testRootFolder = './test';
const rulesRootFolder = './rules';
// also read rules and for respective folder 2029 in test and 2019 in rules apply test in each using rules in rules

const dialects = ['2019-09', '2020-12'];

for (let i=0; i<dialects.length; i++){
    if (i>0){
        const [present, previous] = [dialects[i], dialects[i-1]]
        const presentRulesDir = rulesRootFolder + '/from-' + previous + '/to-'+ present;
        const presentTestDir = testRootFolder + '/from-'+ previous +'/to-'+present;
        const rules = fs.readdirSync(presentRulesDir);
        const tests = fs.readdirSync(presentTestDir);
        // get intersection of these two arrays rules and tests

        const intersection = rules.filter(rule => tests.includes(rule));
        for (const condition of intersection){
            const rule = await readJsonFile(path.join(presentRulesDir, condition));
            const test = path.join(presentTestDir, condition);
            // apply test
            // take the json from test dir and iterate over tests
            fs.readFile(test, 'utf8', (err, data) => {
                if (err) {
                  console.error('Error reading file:', err);
                  return;
                }
              
                const jsonData = JSON.parse(data);
                
                for (const test_case of jsonData){
                    // console.log(test_case, rule, "-----------");
                    const result = applyTest(test_case, rule);
                    console.log(result, test_case["title"]);
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

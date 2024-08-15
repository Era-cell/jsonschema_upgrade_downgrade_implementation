import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Use import.meta.url to get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const drafts = [ 'draft1', 'draft2', 'draft3', 'draft4', 'draft6', 'draft7','2019-09', '2020-12'];

const generateFileList = () => {
  const ruleFiles = {};

  for (let i = 0; i < drafts.length - 1; i++) {
    const fromDraft = drafts[i];
    const toDraft = drafts[i + 1];
    const dirPath = join(__dirname, `./rules/from-${fromDraft}/to-${toDraft}`);
    const files = readdirSync(dirPath).filter(file => file.endsWith('.json'));
    ruleFiles[`${fromDraft}_to_${toDraft}`] = files.map(file => `./rules/from-${fromDraft}/to-${toDraft}/${file}`);
  }

  writeFileSync(join(__dirname, 'ruleFiles.json'), JSON.stringify(ruleFiles, null, 2));
};

generateFileList();

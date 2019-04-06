const fs = require("fs");
const path = require("path");

const projectFilesToDelete = [".flowconfig", "App.js", "__tests__/App-test.js"];

const templateFilesToDelete = ["setup.js", "README.md", "LICENSE"];

const deleteFile = filePath => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
};

const projectPath = path.join(__dirname, "..", "..");
const deleteProjectFile = fileName =>
  deleteFile(path.join(projectPath, fileName));
const deleteTemplateFile = fileName =>
  deleteFile(path.join(__dirname, fileName));

projectFilesToDelete.forEach(deleteProjectFile);
templateFilesToDelete.forEach(deleteTemplateFile);

const fileName = "package.json";
const packagePath = path.resolve(fileName);
let json = require(packagePath);

console.log(`Adding scripts to package.json`);
json.scripts["web"] = "react-scripts start";
json.scripts["build"] = "react-scripts build";
json.scripts["test:web"] = "react-scripts test --env=jsdom";
json.scripts["eject"] = "react-scripts eject";
json.scripts["electron"] =
  "yarn concurrently 'yarn browserless-start' 'yarn wait-on http://localhost:3000/; yarn electron-run'";
json.scripts["electron-run"] =
  "ELECTRON_URL=http://localhost:3000 electron src/index.electron.js";
json.scripts["elecctron-prod-run"] = "electron src/index.electron.js";
json.scripts["browserless-start"] = "BROWSER=none react-scripts start";
json.scripts["lint"] = "tslint './src/**/*.{ts,tsx}'";
json.scripts["lint:fix"] = "tslint --fix './src/**/*.{ts,tsx}'";
json.scripts["generate-assets"] = "python ./scripts/generateAssets.py";
json.scripts["generate-indexes"] = "python ./scripts/generateIndexes.py";
json.scripts["generate-sourcemap"] =
  "ts-node --files scripts/sourceMapStackTrace.ts generate true";
json.scripts["generate-unit-tests"] =
  "ts-node --files scripts/unitTestGenerator.ts";

console.log(`Adding entry point for electron`);
json["main"] = "index.electron.js";
package["browserList"] = [
  ">0.2%",
  "not dead",
  "not ie <= 11",
  "not op_mini all"
];
delete package["jest"];
fs.writeFileSync(fileName, JSON.stringify(json, null, 2));


// TODO: app.json to src/
// TODO: update native code to point to custom entry file: src/index.native.js

console.log("done");

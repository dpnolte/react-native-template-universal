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
let package = require(packagePath);

console.log(`Adding scripts to package.json`);
package.scripts["web"] = "react-scripts start";
package.scripts["build"] = "react-scripts build";
package.scripts["test:web"] = "react-scripts test --env=jsdom";
package.scripts["eject"] = "react-scripts eject";
package.scripts["electron"] =
  "yarn concurrently 'yarn browserless-start' 'yarn wait-on http://localhost:3000/; yarn electron-run'";
package.scripts["electron-run"] =
  "ELECTRON_URL=http://localhost:3000 electron src/index.electron.js";
package.scripts["elecctron-prod-run"] = "electron src/index.electron.js";
package.scripts["browserless-start"] = "BROWSER=none react-scripts start";
package.scripts["lint"] = "tslint './src/**/*.{ts,tsx}'";
package.scripts["lint:fix"] = "tslint --fix './src/**/*.{ts,tsx}'";
package.scripts["generate-assets"] = "python ./scripts/generateAssets.py";
package.scripts["generate-indexes"] = "python ./scripts/generateIndexes.py";
package.scripts["generate-sourcemap"] =
  "ts-node --files scripts/sourceMapStackTrace.ts generate true";
package.scripts["generate-unit-tests"] =
  "ts-node --files scripts/unitTestGenerator.ts";

console.log(`Adding entry point for electron`);
package["main"] = "index.electron.js";
/*package["browserList"] = [
  ">0.2%",
  "not dead",
  "not ie <= 11",
  "not op_mini all"
];
delete package["jest"];*/
fs.writeFileSync(fileName, JSON.stringify(package));


// TODO: app.json to src/
// TODO: update native code to point to custom entry file: src/index.native.js

console.log("done");

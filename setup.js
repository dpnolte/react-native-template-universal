const fs = require("fs");
const path = require("path");
const child_process = require('child_process')

const projectPath = path.join(__dirname);
let hasYarn
try {
    child_process.execSync('yarn --version', {
        stdio: [0, 'pipe', 'ignore'],
    })
    hasYarn = true
} catch (error) {
    hasYarn = false;
}

const ensurePathExists = (pathLike) => {
  if (!fs.existsSync(pathLike)) {
    console.error('Path does not exist: ' + pathLike)
  }
}

const fileName = "package.json"
const packagePath = path.join(projectPath, fileName);
ensurePathExists(packagePath);


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
json.scripts["electron-prod-run"] = "electron src/index.electron.js";
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
json["browserslist"] = [
  ">0.2%",
  "not dead",
  "not ie <= 11",
  "not op_mini all"
];
// jest version nr gets overwritten
let requiresInstall = false
if (json["devDependencies"]["babel-jest"] !== '^23.6.0') {
  json["devDependencies"]["babel-jest"] = '^23.6.0'
  requiresInstall = true
}
if (json["devDependencies"]["jest"] !== '^23.6.0') {
  json["devDependencies"]["jest"] = '^23.6.0'
  requiresInstall = true
}
delete json["jest"];
fs.writeFileSync(fileName, JSON.stringify(json, null, 2));

if (requiresInstall) {
  console.log('Requires new install (probably due to Jest downgrade)')
  if (hasYarn) {
    console.log('using yarn')
    child_process.execSync('yarn', {stdio: 'inherit'})
  } else {
    console.log('using npm')
    child_process.execSync('npm prune', {stdio: 'inherit'})
    child_process.execSync('npm install', {stdio: 'inherit'})
  }
}

const filesToDelete = [".flowconfig", "App.js", "__tests__/App-test.js", "README.md", "LICENSE"];
const foldersToDelete = ["__tests__"];

console.log('Deleting unnessary files')
const deleteFile = filePath => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
};
const deleteFolder = folderPath => {
  if (!fs.existsSync(folderPath)) {
    return;
  }
  fs.rmdirSync(folderPath)
}


filesToDelete.forEach(fileName => deleteFile(path.join(projectPath, fileName)));
foldersToDelete.forEach(folderName => deleteFolder(path.join(projectPath, folderName)))


const appJsonFileName = 'app.json'
console.log(`moving ./${appJsonFileName} to ./src/${appJsonFileName}`)
const oldAppJsonPath = path.join(projectPath, appJsonFileName)
const appJsonPath = path.join(projectPath, "src", appJsonFileName)
if (fs.existsSync(oldAppJsonPath)) {
  fs.renameSync(oldAppJsonPath, appJsonPath)
}
ensurePathExists(appJsonPath)
const appName = require(appJsonPath).name

// TODO: update native code to point to custom entry file: src/index.native.js
console.log('Updating custom entry file for react native')

const updateFileWithRegex = (pathLike, regex, replaceValue) => {
  ensurePathExists(pathLike)
  const oldContents = fs.readFileSync(pathLike).toString()
  if (!regex.exec(oldContents)) {
    console.warn(`Regex not matching, not updating ${pathLike}`)
    return
  }
  const contents = oldContents.replace(regex, replaceValue)
  fs.writeFileSync(pathLike, contents)
}

const androidAppPath = path.join(projectPath, 'android', 'app')
const appGradlePath = path.join(androidAppPath, 'build.gradle')
const appGradleRegex = /(.*\s+project.ext.react\s+=\s+\[.*\s+entryFile:\s+")(.+)("\s+.*\]\s+.*)/
updateFileWithRegex(appGradlePath, appGradleRegex, '$1src/index.native.js$3')

const mainApplicationPath = path.join(androidAppPath, 'src', 'main', 'java', 'com', appName, 'MainApplication.java')
const mainApplicationRegex = /(.*\s+protected\s+String\s+getJSMainModuleName\(\)\s+{\s+return\s+")(.+)("\s*;\s+.*)/
updateFileWithRegex(mainApplicationPath, mainApplicationRegex, '$1src/index.native$3')

const iosPath = path.join(projectPath, "ios")
const appDelegatePath = path.join(iosPath, appName, "AppDelegate.m")
const appDelegateRegex = /(.*\s+jsBundleURLForBundleRoot:@")(.+)("\s+.*)/
updateFileWithRegex(appDelegatePath, appDelegateRegex, '$1src/index.native$3')

const xcodeProjectPath = path.join(iosPath, `${appName}.xcodeproj`, 'project.pbxproj')
const xcodeProjectRegex = /(.*\s+shellScript\s*=\s*"export\s+NODE_BINARY=node\\n\.\.\/node_modules\/react-native\/scripts\/react-native-xcode.sh)(";.*)/g
updateFileWithRegex(xcodeProjectPath, xcodeProjectRegex, '$1 src/index.native.js$2')

console.log('deleting setup.js')
fs.unlinkSync(__filename)
console.log("done");

import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import { projectDir, targetTestDir } from './unitTestGenerator/testsWriter';
import { generateUnitTests } from './unitTestGenerator/ASTReader';

// clear any old test files 
const oldFileNames = fs.readdirSync(targetTestDir)
for (const fileName of oldFileNames) {
  if (fileName.endsWith('.test.tsx')) {
    const filePath = path.resolve(targetTestDir, fileName)
    fs.unlinkSync(filePath)
  }
}

const sourceDir = path.resolve(projectDir, "src")
const componentsDir = path.resolve(sourceDir, "components")
const targetedFiles = new Set<string>();
const fileNames = fs.readdirSync(componentsDir)
for (const fileName of fileNames) {
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
    const filePath = path.resolve(componentsDir, fileName)
    targetedFiles.add(filePath)
  }
}

generateUnitTests(targetedFiles, {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
})
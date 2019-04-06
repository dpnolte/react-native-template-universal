import fs from 'fs'
import path from 'path'
import { IMetaReactComponent, IAdditionalImports, IMetaProp } from './ASTReader'

enum ValueSetGeneratorStrategy {
  Cartesian='Cartesian',
  VaryFromBaseline='VaryFromBaseline'
}
const VALUE_SET_GENERATOR_STRATEGY: ValueSetGeneratorStrategy = ValueSetGeneratorStrategy.VaryFromBaseline
const IGNORE_PROPERTY = '*!!IGNORE_PROPERTY!!*'
export const projectDir = path.resolve(__dirname, "..", "..")
export const testDir = path.resolve(projectDir, "test")
export const generatedTestDir = path.resolve(testDir, "generated")
export const targetTestDir = path.resolve(generatedTestDir, "components")

const getImportStatement = (importPath: string, importTypes: string[]) =>
  `import { ${importTypes.join(', ')} } from '${importPath}'`
const testsFileTemplate = (
  tests: string,
  componentName: string,
  additionalImports: IAdditionalImports
) =>
  `import React from 'react';
import renderer from 'react-test-renderer';
${Object.keys(additionalImports).map(p => getImportStatement(p, additionalImports[p])).join('\n')}

describe('${componentName} - generated tests', () => {
  ${tests}
});
`

const testTemplate = (
  testId: string,
  componentName: string,
  testDescription: string,
  propsLiteral: string
) =>
  `it('#${testId} - ${componentName} - ${testDescription}', () => {
    const tree = renderer.create(
      <${componentName}
        ${propsLiteral}
      />
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
`

const PROP_DELIMITER = '\n        '
const generateUnitTestForValueCombination = (  
  component: IMetaReactComponent,
  valueCombination: string[],
  testId: string,
  testDescription: string
): string => {
  const propsLiteralList: string[] = []
  component.members.forEach(
    (metaProp, i) => {
      if (valueCombination[i] !== IGNORE_PROPERTY) {
        propsLiteralList.push(`${metaProp.name}={${valueCombination[i]}}`)
      }
    }
  )
  const propsLiteral = propsLiteralList.join(PROP_DELIMITER)

  return testTemplate(testId, component.componentName, testDescription, propsLiteral)
}

// Value set generators
interface IValueSetGeneratorResult {
  valueSets: string[][];
  additinalTestIds?: string[];
}
type ValueSetGeneratorType = (arrOfArr: string[][], metaProps: IMetaProp[]) => IValueSetGeneratorResult;
// this produces every possible combination of properties
const cartesianProduct: ValueSetGeneratorType = (arrOfArr: string[][], metaProps: IMetaProp[]): IValueSetGeneratorResult => {
  const valueSets = arrOfArr.reduce(
    (acc: string[][], next) =>
      acc
        .map(x => next.map(y => x.concat(y)))
        .reduce((c, d) => c.concat(d), []),
    [[]]
  )
  return {
    valueSets
  }
}
// this takes a baseline and produces baseline variants by changing one property
const varyFromBaseline: ValueSetGeneratorType = (arrOfArr: string[][], metaProps: IMetaProp[]): IValueSetGeneratorResult => {
  const valueSets: string[][] = []
  const additinalTestIds = [ 'baseline', 'only required properties']
  const baseline = arrOfArr.map(set => set[0])
  valueSets.push(baseline)
  const requiredProps = [...baseline]
  for (let propIndex = 0; propIndex < metaProps.length; propIndex++) {
    const metaProp = metaProps[propIndex]
    if (!metaProp.isRequired) {
      requiredProps[propIndex] = IGNORE_PROPERTY
    }
  }
  valueSets.push(requiredProps)
  let setIndex = 0
  for(const set of arrOfArr) {
    for (const value of set.slice(1)) {
      const variant = [...baseline]
      variant[setIndex] = value
      valueSets.push(variant)
      const propertyName = metaProps[setIndex] ? metaProps[setIndex].name : 'unknown'
      additinalTestIds.push(`variant ${propertyName}=${value.replace(/'/g, "\\'")}`)
    }
    setIndex += 1
  }
  return {
    valueSets,
    additinalTestIds
  }
}

const valueSetGenerator: ValueSetGeneratorType = VALUE_SET_GENERATOR_STRATEGY === ValueSetGeneratorStrategy.VaryFromBaseline
  ? varyFromBaseline : cartesianProduct

export const writeUnitTestsForComponent = (component: IMetaReactComponent) => {
  if (!fs.existsSync(generatedTestDir)) {
    fs.mkdirSync(generatedTestDir)
  }
  if (!fs.existsSync(targetTestDir)) {
    fs.mkdirSync(targetTestDir)
  }

  let testContents = ''
  const { valueSets, additinalTestIds } = valueSetGenerator(component.valueRangePerProp, component.members)
  let current = 1
  for (const valueSet of valueSets) {
    let testDescription = `generated test #${current}`
    if (additinalTestIds && additinalTestIds[(current - 1)]) {
      testDescription += ' - ' + additinalTestIds[(current - 1)]
    }
    let testId = component.testIdPrefix
    if (current < 10) {
      testId += `-00${current}`
    } else if (current < 100) {
      testId += `-0${current}`
    } else {
      testId += `-${current}`
    }
    testContents += generateUnitTestForValueCombination(component, valueSet, testId, testDescription)
    current += 1
  }

  const fileContents = testsFileTemplate(testContents, component.componentName, component.additionalImports)
  const filePath = path.resolve(targetTestDir, `${component.componentName}.test.tsx`)
  fs.writeFileSync(filePath, fileContents)
}

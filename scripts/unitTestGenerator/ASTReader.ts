import path from 'path';
import ts from 'typescript';
import { targetTestDir, writeUnitTestsForComponent } from './testsWriter';
import { getValueRangePerProp } from './valuesGenerator';

const componentTypes = new Set<string>([
  'Component',
  'PureComponent',
  'StatelessComponent',
  'FunctionalComponent',
])
const dispatchPropTypes = new Set<string>(['IDispatchProps'])
const injectedPropTypes = new Set<string>(['InjectedProps'])
const ownPropTypes = new Set<string>(['IOwnProps'])

export interface IAdditionalImports {
  [path: string]: string[]
}
export interface IMetaReactComponent {
  componentName: string
  testIdPrefix: string;
  componentExpression: ts.ExpressionWithTypeArguments
  propertiesNode: ts.TypeNode
  members: IMetaProp[]
  valueRangePerProp: string[][]
  importPath: string
  additionalImports: IAdditionalImports
}

export enum MetaPropCategory {
  Dispatch = 'Dispatch',
  Injected = 'Injected',
  Own = 'Own'
}

export interface IMetaProp {
  name: string
  symbol: ts.Symbol
  type: ts.Type
  typeAsString: string
  category: MetaPropCategory
  isRequired: boolean
  isEnum: boolean
  enumValues?: string[]
}

const isNodeExported = (decl: ts.Declaration): boolean => {
  return (
    // tslint:disable-next-line:no-bitwise
    (ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Export) !== 0 ||
    (!!decl.parent && decl.parent.kind === ts.SyntaxKind.SourceFile)
  )
}
const isReactComponentExpression = (
  expressionWithTypeArguments: ts.ExpressionWithTypeArguments,
  checker: ts.TypeChecker
): boolean => {
  if (componentTypes.has(expressionWithTypeArguments.expression.getText())) {
    const heritageType = checker.getTypeAtLocation(expressionWithTypeArguments)
    const fqn = checker.getFullyQualifiedName(heritageType.symbol)
    const splitFQN = fqn.split('.')
    if (
      splitFQN.length === 2 &&
      splitFQN[0] === 'React' &&
      componentTypes.has(splitFQN[1])
    ) {
      return true
    }
  }

  return false
}

const getPropertiesTypeArgumentNode = (
  componentExpression: ts.ExpressionWithTypeArguments
): ts.TypeNode | null => {
  let propertiesNode: ts.TypeNode | null = null
  if (componentExpression.typeArguments !== null) {
    const typeArguments = componentExpression.typeArguments
    if (typeArguments && typeArguments.length > 0) {
      propertiesNode = typeArguments[0]
    }
  }
  return propertiesNode
}

const createMetaProp = (
  symbol: ts.Symbol,
  name: string,
  category: MetaPropCategory,
  checker: ts.TypeChecker,
  additionalImports: IAdditionalImports
): IMetaProp => {
  const type = checker.getTypeAtLocation(symbol.valueDeclaration)
  const typeAsString = checker.typeToString(type)
  if (typeAsString === "IAccount" && !additionalImports["../../mocks/account"]) {
    additionalImports["../../mocks/account"] = ['mockedAccounts']
  }
  let isEnum = false
  let enumValues: string[] | undefined
  if (
    type.symbol &&
    type.symbol.declarations &&
    type.symbol.declarations.length > 0
  ) {
    const potentialEnumDecl = type.symbol.declarations[0]
    if (ts.isEnumDeclaration(potentialEnumDecl)) {
      const enumDecl = potentialEnumDecl
      enumValues = []
      for (const member of enumDecl.members) {
        enumValues.push(member.name.getText())
      }
      isEnum = enumValues.length > 0
      const additionalImportPath = path
        .relative(targetTestDir, enumDecl.getSourceFile().fileName)
        .replace('.tsx', '')
        .replace('.ts', '')
      if (!additionalImports[additionalImportPath]) {
        additionalImports[additionalImportPath] = [typeAsString]
      } else {
        const imports = additionalImports[additionalImportPath]
        imports.push(typeAsString)
      }
    }
  }

  // tslint:disable-next-line:no-bitwise
  const isRequired = (symbol.flags & ts.SymbolFlags.Optional) === 0
  return {
    name,
    symbol,
    category,
    type,
    typeAsString,
    isRequired,
    isEnum,
    enumValues,
  }
}

// recursive (visits any base types)
const createMetaProps = (
  subPropertyTypeNode: ts.Node,
  category: MetaPropCategory,
  checker: ts.TypeChecker,
  metaProps: IMetaProp[],
  additionalImports: IAdditionalImports
) => {
  const propInterfaceType: ts.Type = checker.getTypeAtLocation(
    subPropertyTypeNode
  )
  const members = propInterfaceType.symbol.members
  if (members) {
    members.forEach((memberSymbol, memberName) => {
      metaProps.push(
        createMetaProp(
          memberSymbol,
          memberName as string,
          category,
          checker,
          additionalImports
        )
      )
    })
  }
  // also check for heritage clause for inherited props
  const baseTypes = propInterfaceType.getBaseTypes()
  if (baseTypes && baseTypes.length > 0) {
    for (const baseInterfaceType of baseTypes) {
      if (
        baseInterfaceType.symbol &&
        baseInterfaceType.symbol.declarations &&
        baseInterfaceType.symbol.declarations.length > 0
      ) {
        const declaration = baseInterfaceType.symbol.declarations[0]
        createMetaProps(
          declaration,
          category,
          checker,
          metaProps,
          additionalImports
        )
      }
    }
  }
}
const getPropsMembers = (
  propertiesNode: ts.TypeNode,
  checker: ts.TypeChecker,
  additionalImports: IAdditionalImports
): IMetaProp[] => {
  let metaProps: IMetaProp[] = []
  const propertiesType = checker.getTypeAtLocation(propertiesNode)
  const declaration = propertiesType.symbol.declarations[0]
  // todo: handle type alias declarations (e.g., type IProps = IDispatchProps & InjectedProps)
  if (ts.isInterfaceDeclaration(declaration)) {
    if (declaration.heritageClauses) {
      const propertiesHeritageClauses = declaration.heritageClauses
      if (propertiesHeritageClauses.length > 0) {
        const propertiesHeritageClause = propertiesHeritageClauses[0]
        for (const subPropertyNode of propertiesHeritageClause.types) {
          const nodeName = subPropertyNode.expression.getText()
          if (dispatchPropTypes.has(nodeName)) {
            const newProps: IMetaProp[] = []
            createMetaProps(
              subPropertyNode,
              MetaPropCategory.Dispatch,
              checker,
              newProps,
              additionalImports
            )
            metaProps = metaProps.concat(newProps)
          } else if (injectedPropTypes.has(nodeName)) {
            const newProps: IMetaProp[] = []
            createMetaProps(
              subPropertyNode,
              MetaPropCategory.Injected,
              checker,
              newProps,
              additionalImports
            )
            metaProps = metaProps.concat(newProps)
          } else if (ownPropTypes.has(nodeName)) {
            const newProps: IMetaProp[] = []
            createMetaProps(
              subPropertyNode,
              MetaPropCategory.Own,
              checker,
              newProps,
              additionalImports
            )
            metaProps = metaProps.concat(newProps)
          }
        }
      }
    }
  }
  return metaProps
}

const findReactComponentsWithProps = (
  node: ts.Node,
  checker: ts.TypeChecker
): IMetaReactComponent[] => {
  const components: IMetaReactComponent[] = []
  // todo: also check if variable declaration is a react component (e.g., const c: React.StatelessComponent<IProps> = (props: IProps) = { .. })
  if (ts.isClassDeclaration(node)) {
    // class needs to be expored and has to be inherited from React.Component
    if (
      isNodeExported(node) &&
      node.heritageClauses &&
      node.name
    ) {
      const name: ts.Identifier = node.name
      const heritageClauses = node.heritageClauses
      const importPath = path
        .relative(targetTestDir, node.getSourceFile().fileName)
        .replace('.tsx', '')
        .replace('.ts', '')
      for (const heritageClause of heritageClauses) {
        const nullableComponentExpression = heritageClause.types.find(e =>
          isReactComponentExpression(e, checker)
        )
        if (nullableComponentExpression) {
          // it is a react component
          const componentExpression = nullableComponentExpression
          const propertiesNode = getPropertiesTypeArgumentNode(
            componentExpression
          )
          if (propertiesNode !== null) {
            const componentName = name.getText()
            const additionalImports: IAdditionalImports = {}
            additionalImports[importPath] = [componentName]
            const members = getPropsMembers(
              propertiesNode,
              checker,
              additionalImports
            )
            if (members.length > 0) {
              const component = {
                componentName,
                componentExpression,
                propertiesNode,
                members,
                valueRangePerProp: getValueRangePerProp(members),
                importPath,
                additionalImports,
                testIdPrefix:  getTestIdPrefix(componentName),
              }
              console.log(
                '-\tWriting unit tests for component ' + componentName
              )
              writeUnitTestsForComponent(component)
              components.push(component)
            }
          }
          break // if one clause is a React.Component, stop looping through heritageClauses
        }
      }
    }
  }
  return components
}


/**
 * Return testIdPrefix... we prefix non-numeric prefixes to avoid confusion
 * @param componentName string name of React component
 */
const getTestIdPrefix = (componentName: string): string => {
  let testIdPrefix = componentName.replace('Inner', '').substr(0, 5).toUpperCase()
  if (testIdPrefixMemory.has(testIdPrefix)) {
    testIdPrefix = testIdPrefix + componentName.substr(componentName.length - 3).toUpperCase()
  }
  while (testIdPrefixMemory.has(testIdPrefix)) {
    testIdPrefix += testIdPrefix
  }
  testIdPrefixMemory.add(testIdPrefix)
  return testIdPrefix
}
const testIdPrefixMemory = new Set<string>()


export const generateUnitTests = (
  fileNames: Set<string>,
  options: ts.CompilerOptions
) => {
  // Build a program using the set of root file names in fileNames
  const program = ts.createProgram(Array.from(fileNames), options)

  // Get the checker, we will use it to find more about classes
  const typeChecker = program.getTypeChecker()

  // Visit every sourceFile in the program
  console.log('Collecting relevant source files...')
  const relevantSourceFiles = program
    .getSourceFiles()
    .filter(sf => fileNames.has(sf.fileName))
  console.log('Done')
  const last = relevantSourceFiles.length
  let current = 1
  for (const sourceFile of relevantSourceFiles) {
    console.log(
      `Processing file (${current}/${last}): '${sourceFile.fileName}'`
    )
    current += 1
    // Walk the tree to search for classes; (note: only looking for top level class declaration now)
    let reactComponents: IMetaReactComponent[] = []
    const classDeclarations: ts.ClassDeclaration[] = []
    ts.forEachChild(sourceFile, n => {
      if (ts.isClassDeclaration(n)) {
        classDeclarations.push(n)
      }
    })
    const lastClass = classDeclarations.length
    let currentClass = 1
    for (const classDeclaration of classDeclarations) {
      console.log(
        `- \tProcessing class (${currentClass}/${lastClass}): '${classDeclaration
          .getText()
          .substr(0, 30)}...'`
      )
      currentClass += 1
      const foundComponents = findReactComponentsWithProps(
        classDeclaration,
        typeChecker
      )
      console.log('-\tFound ' + foundComponents.length + ' components!')
      reactComponents = reactComponents.concat(foundComponents)
    }
  }
}


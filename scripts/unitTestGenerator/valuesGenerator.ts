import { IMetaProp, MetaPropCategory } from "./ASTReader";


const JEST_MOCKED_FUNCTION = 'jest.fn() as any' 
const JEST_MOCKED_NAV = '({ setParams: jest.fn()} as any)'
export const getValueRangePerProp = (metaProps: IMetaProp[]): string[][] => {
  const valueRangePerProp: string[][] = []
  for (const metaProp of metaProps) {
    valueRangePerProp.push(getValueRange(metaProp))
  }
  return valueRangePerProp;
}

const getValueRange = (metaProp: IMetaProp): string[] => {
  if (metaProp.category === MetaPropCategory.Dispatch) {
    return getValueRangeForDispatchProps(metaProp)
  } else {
    return getValueRangeForInjectedAndOwnProps(metaProp)
  }
}

const getValueRangeForInjectedAndOwnProps = (metaProp: IMetaProp): string[] => {
  let range: string[] = [];
  if (metaProp.isEnum && metaProp.enumValues) {
    range = metaProp.enumValues.map(ev => `${metaProp.typeAsString}.${ev}`)
  } else if(metaProp.typeAsString.startsWith("NavigationScreenProp<")) {
    range = [JEST_MOCKED_NAV]
  } else {
    switch(metaProp.typeAsString) {
      case 'void':
      case 'undefined':
        range = ['undefined']
        break;
      case 'null':
        range = ['null']
        break;
      case 'string':
        range = ['\'\'', '\'value\''];
        break;
      case 'number':
      case 'any':
        range = ['-10', '0', '10'];
        break;
      case 'boolean':
        range = ['false', 'true']
        break;
      case 'object':
        range = ['{}']
        break;
      case 'React.ReactNode':
        range = ['<View />', 'undefined']
        break;      
      case 'IAccount':
        range = ['mockedAccounts[0]', 'mockedAccounts[1]'];
        break;
      default:
        console.error('Unknown type ' + metaProp.typeAsString + '. We don\'t know how to generate a value range for this type.')
    }
  }
  return range
}

const getValueRangeForDispatchProps = (metaProp: IMetaProp): string[] => {
  return [JEST_MOCKED_FUNCTION]
}


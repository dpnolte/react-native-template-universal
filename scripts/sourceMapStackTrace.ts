import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { execSync } from 'child_process'
import { SourceMapConsumer } from 'source-map'
import StackTrace from 'stacktrace-js'
let sourceMapConsumer: SourceMapConsumer | undefined = undefined

// const exampleTrace = 'value@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:538:1371 Jn@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:34762 gr@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:42973 Jr@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:61660 Kr@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:62132 zi@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:69082 Ii@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:68425 wi@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:67364 ri@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:66101 Wi@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:74236 render@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:95:76600 exports@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:319:496 run@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:315:615 runApplication@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:315:2017 value@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:37:3311 /Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:37:822 value@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:37:2565 value@/Users/derk/Library/Developer/CoreSimulator/Devices/0E68D442-C44A-4039-A262-319BE3E76CC6/data/Containers/Bundle/Application/435A7C99-A44B-4258-B699-6FA88826D7C7/FTI_Touristik-Product.app/main.jsbundle:37:794 value@[native code]'.replace(" ", "\n")


const create = async (path: string) => {
	let mapContents: any
	try {
		try {
			mapContents = fs.readFileSync(path)
		} catch (err) {
			let msg = `Unable to read source maps, possibly invalid sourceMapBundle file, please check that the source map is bundled @: ${path}`
			msg += `\nOriginal error: ${err.message}`
			throw new Error(msg)
		}
		const sourceMaps = JSON.parse(mapContents)
		sourceMapConsumer = await new SourceMapConsumer(sourceMaps)

	} catch (error) {
		throw error
	}
}

const getSourceForPosition = (position: {
lineNumber: number
columnNumber: number
}) => {
	if (!sourceMapConsumer) throw Error('SourceMapConsumer not yet initialized')
	return sourceMapConsumer.originalPositionFor({
		line: position.lineNumber,
		column: position.columnNumber
	})
}

export interface IStackTraceItem {
	fileName: string
	functionName: string
	lineNumber: number | null
	columnNumber: number | null
	position: string
}
const get = async (stack: string, isIOS: boolean): Promise<IStackTraceItem[]> => {
	if (!sourceMapConsumer) {
		throw Error('SourceMapConsumer is not yet initialized; run create first with the path to the appropriate sourcemap (note: there are specific android and iOS versions')
	}
	try {
    const error = new Error('recreating error for stacktrace')
    error.stack = stack
    let minStackTrace: StackTrace.StackFrame[]
		if (isIOS) {
			minStackTrace = await StackTrace.fromError(error)
		} else {
			minStackTrace = await StackTrace.fromError(error, { offline: true })
    }

		const stackTrace: IStackTraceItem[] = minStackTrace.map(row => {
			const mapped = getSourceForPosition(row)
			const source = mapped.source || ''
			const fileName = source
			const functionName = mapped.name || 'unknown'
			return {
				fileName,
				functionName,
				lineNumber: mapped.line,
				columnNumber: mapped.column,
				position: `${functionName}@${fileName}:${mapped.line}:${mapped.column}`
			}
		})
		return stackTrace
	} catch (error) {
		throw error
	}
}

const load = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });


  const androidOrIOS: string = await new Promise((resolve) => rl.question('Source map stack trace for Android or IOS (Android/IOS): ', resolve))
  let selectedPlatform = ""
  if (androidOrIOS.toLowerCase() === 'android') {
    selectedPlatform = "android"
  } else if (androidOrIOS.toLowerCase() === 'ios') {
    selectedPlatform = "ios"
  } else {
    throw Error('Invalid input')
  }

  const sourceMapDir = path.resolve(__dirname, "sourceMaps")
  const files = fs.readdirSync(sourceMapDir)
  const versions: { [version: string]: string } = {}
  for (const file of files) {
    const filename = path.basename(file)
    const [name, platform, version ] = filename.substr(0, filename.length - 3).split("|")
    if (platform === selectedPlatform) {
      versions[version] = path.resolve(sourceMapDir, file)
    }
  }
  console.log('Available versions: ' + Object.keys(versions).join(', '))
  const appStoreVersion: string = await new Promise((resolve) => rl.question('Enter app store version: ', resolve))

  const filePath = versions[appStoreVersion]
  if (!filePath) {
    throw Error('Invalid version')
  }

  await StackTraceSourcerer.create(filePath)

  const stacktrace: string = await new Promise((resolve) => rl.question('Enter javascript stacktrace:\n', resolve))
  // const stacktrace = exampleTrace
  const stackTraceItems = await StackTraceSourcerer.get(stacktrace, selectedPlatform === 'ios')
  console.log('Stacktrace:')
  for (const item of stackTraceItems) {
    console.log(item.position)
  }
}

const generateSourceMaps = async () => {
  const cliPath = require.resolve('react-native/local-cli/cli');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const version = await new Promise((resolve) => rl.question('Enter app store version: ', resolve))
  console.log('Generating iOS source maps....')
  let cmd = `node ${cliPath} bundle --entry-file "index.js" --platform ios --dev false --sourcemap-output ./scripts/sourceMaps/sourcemap|ios|${version}.js --bundle-output /tmp/group.bundle --reset-cache`
  console.log('Generating Android source maps....')
  console.log(cmd)
  execSync(cmd)
  cmd = `node ${cliPath} bundle --entry-file "index.js" --platform android --dev false --sourcemap-output ./scripts/sourceMaps/sourcemap|android|${version}.js --bundle-output /tmp/group.bundle --reset-cache`
  execSync(cmd)

}

// log with crashlytics

interface IStackTraceSourcerer {
  create: (path: string) => void;
	get: (stack: string, isIOS: boolean) => Promise<IStackTraceItem[]>
}

const StackTraceSourcerer: IStackTraceSourcerer = {
  create,
	get
}

/**
 * Run script
 * @argument generate bool - optional - generate source map files
 */

const run = async () => {
  let mustGenerateSourceMaps: boolean = false
  let mustLoadSourceMap: boolean = false
  let i = 0
  for (const arg of process.argv) {
    if (arg === "generate" && process.argv[(i + 1)] === "true") {
      mustGenerateSourceMaps = true
    }
    if (arg === "load" && process.argv[(i + 1)] === "true") {
      mustLoadSourceMap = true
    }
    i += 1
  }
  try {
    if (mustGenerateSourceMaps === true) {
      await generateSourceMaps()
    }
    if (mustLoadSourceMap === true) {
      await load()
    }
    return process.exit(0)
  } catch(e) {
    console.log(e.message)
    console.log(e.stack)
    return process.exit(1)
  }
}

run()
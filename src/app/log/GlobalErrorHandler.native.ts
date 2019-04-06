/* TODO:
prefer to implement logging myself, like here: https://medium.com/delivery-com-engineering/add-crashlytics-to-your-react-native-ios-app-69a983a9062a
*/
const crashlytics = {
  log: (msg: string) => console.log('noop', msg),
  setUserIdentifier: (id: string) => console.log('noop', id),
  recordError: (code: number, msg: string) => console.log('noop', code, msg)
}
const firebase = {
  crashlytics: () => crashlytics
}
import { Alert, NativeModules } from 'react-native'
const { ErrorHandlerModule } = NativeModules

let initialized = false
let useDefaultHandler = __DEV__

export type ErrorLoggerType = (item: string) => void
const defaultErrorLogger: ErrorLoggerType = item => {
	if (ErrorHandlerModule) {
		ErrorHandlerModule.logError(ErrorHandlerModule.ERROR_TAG, item)
	} else {
    // firebase.crashlytics().log(item)
    console.error(item)
	}
}
let errorLogger: ErrorLoggerType = defaultErrorLogger

export type InfoLoggerType = (item: string) => void
const defaultInfoLogger: InfoLoggerType = item => {
	if (ErrorHandlerModule) {
		ErrorHandlerModule.logInfo(ErrorHandlerModule.INFO_TAG, item)
	} else {
		firebase.crashlytics().log(item)
	}
}
let infoLogger: InfoLoggerType = defaultInfoLogger

export type UserIdLoggerType = (userId: string) => void
let lastUserId = ''
const defaultUserIdLogger: UserIdLoggerType = userId => {
	if (userId !== lastUserId) {
		firebase.crashlytics().setUserIdentifier(userId)
		lastUserId = userId
	}
}
let userIdLogger: UserIdLoggerType = defaultUserIdLogger

export type RecordNonFatalErrorType = (err: Error) => void
const defaultRecordNonFatalError: RecordNonFatalErrorType = err => {
	const message = `Javascript-side uncaught exception: ${err.message}`
	if (ErrorHandlerModule) {
		ErrorHandlerModule.reportNonFatalError(message)
	} else {
		firebase
			.crashlytics()
			.recordError((err as any).code ? (err as any).code : 1985, message)
	}
}
let nonFatalErrorRecorder: RecordNonFatalErrorType = defaultRecordNonFatalError

const init = (
	eL: ErrorLoggerType | undefined = undefined,
	iL: InfoLoggerType | undefined = undefined,
	userId: UserIdLoggerType | undefined = undefined,
	recorder: RecordNonFatalErrorType | undefined = undefined
) => {
	errorLogger = eL || errorLogger
	infoLogger = iL || infoLogger
	userIdLogger = userId || userIdLogger
	nonFatalErrorRecorder = recorder || nonFatalErrorRecorder
	if (initialized) return

	const defaultGlobalHandler = ErrorUtils.getGlobalHandler()
	ErrorUtils.setGlobalHandler(async (err, isFatal) => {
		try {
      // should we only sourcemap when in non dev mode (TBC)?
      // that is, when in __DEV__ mode the stack trace points to files on the metro packager server 
	  // and makes our source map jibberish
	  // convert stack trace to source mapped stack trace after it is logged in crashlytics
	  // so that we save app file size
			const oldLimit = Error.stackTraceLimit
			Error.stackTraceLimit = 100
			reportError(err, isFatal)
			Error.stackTraceLimit = oldLimit
		} catch (errorHandlingError) {
			console.error(errorHandlingError)
			errorLogger(
				'Unable to init global error handler (something wrong with the sourcemap?)\n ' +
					errorHandlingError.message
			)
		} finally {
			Alert.alert(
				'Sorry!',
				'An unforeseen error has occured. Please try again!'
			)
		}
		if (useDefaultHandler && defaultGlobalHandler) {
			defaultGlobalHandler(err, isFatal)
		}
	})
  initialized = true
  /* uncomment this to test a native exception*
  setTimeout(() => {
    ErrorHandlerModule.throwNativeException()
  }, 10000) */
}

const reportError = (
	err: Error,
	isFatal: boolean | undefined
) => {
	if (typeof isFatal !== 'undefined' && isFatal === true) {
		errorLogger(`Uncaught fatal ${err.name}! Message: ${err.message}`)
	} else {
		errorLogger(`Uncaught ${err.name}! Message: ${err.message}`)
	}
	if (err.stack) {
		errorLogger(`Original stack trace (still needs to be source mapped): ${err.stack}`)
	}
	errorLogger(`Navigation path: ${navigationPath.join('->')}`)

	nonFatalErrorRecorder(err) // this will record a non-fatal error in crashlytics
}

const logApiResponse = (r: ILoggedApiResponseInput) => {
	const resp = r as ILoggedApiResponse
	resp.dateTime = new Date().toISOString()
	resp.currentScreen =
		navigationPath.length > 0
			? navigationPath[navigationPath.length - 1]
			: 'unknown'
	// we are immmediately logging this so that we don't have to have all responses in memory
	infoLogger(
		`${resp.url} @ ${resp.dateTime} (success: ${resp.success}, screen: ${
			resp.currentScreen
		}) => ${resp.response}`
	)
}

interface ILoggedApiResponseInput {
	url: string
	response: string
	success: boolean
}
interface ILoggedApiResponse extends ILoggedApiResponseInput {
	dateTime: string
	currentScreen: string
}

const navigationPath: string[] = ['StartScreen']

interface IGlobalErrorHandler {
	init: (logger?: ErrorLoggerType) => void
  logBeforeCrash: ErrorLoggerType
  logNonFatalError: ErrorLoggerType
	logUserId: UserIdLoggerType
	addToNavigationPath: (routeName: string) => void
	addPreviousToNavigationPath: () => void
	logApiResponse: (resp: ILoggedApiResponseInput) => void
}
export const GlobalErrorHandler: IGlobalErrorHandler = {
	init,
  logBeforeCrash: errorLogger,
  logNonFatalError: errorLogger,
	logUserId: userIdLogger,
	addToNavigationPath: (routeName: string) => {
		infoLogger(`Navigated to: ${routeName}`)
		navigationPath.push(routeName)
	},
	addPreviousToNavigationPath: () => {
		if (navigationPath.length > 0) {
			const routeName = navigationPath[navigationPath.length - 1]
			infoLogger(`Navigated to: ${routeName}`)
			navigationPath.push(routeName)
		}
	},
	logApiResponse
}

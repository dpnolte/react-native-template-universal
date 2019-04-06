import { ajax } from 'rxjs/ajax';
import { retry, catchError, delay, flatMap, take } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
// import { GlobalErrorHandler } from '../../log/GlobalErrorHandler';


const isEmptyObj = (json: any) => {
  return typeof (json) === 'object' && Object.keys(json).length === 0;
}
const isEmptyArray = (json: any) => {
  return Array.isArray(json) && json.length === 0;
}

export interface IFetchResult<TResponse extends {}> {
  success: boolean;
  response?: TResponse 
}

const maxApiCallRetries = /*parseInt(config.API_CALL_RETRIES, 10) ||*/ 3
const retryDelay = 500
const httpStatusCodeOk = 200
const jsonResponseType = 'json'

function fetchJson<TResponse = {}>(url: string): Observable<TResponse> {
  console.debug('🚀 ' + url)
  let retries = 0
  return ajax.get(url).pipe(
    flatMap(result => {
      const { status, response, responseType } = result
      if (status !== httpStatusCodeOk) {
        throw Error(`Invalid HTTP response code ${url}. http status: ${status}, response: ${response}`);
      }
      if (responseType !== jsonResponseType) {
        throw Error(`Invalid HTTP response type ${url}. http status: ${status}, response: ${response}`);
      }
      if (isEmptyObj(response) || isEmptyArray(response)) {
        throw Error(`Json parsed but empty object or array response from ${url}, http status: ${status}, response: ${response}`);
      }
      /*GlobalErrorHandler.logApiResponse({
        url,
        response: result.responseText,
        success: true
      })*/
      return of(response)
    }),
    take(1),
    catchError(err => {
      retries += 1
      if (retries <= maxApiCallRetries) {
        console.debug(`Api call failed, retrying in ${retryDelay} ms (attempt ${retries}/${maxApiCallRetries}): ${url}`)
        console.debug(err)
      } else {
        /*GlobalErrorHandler.logApiResponse({
          url,
          response: `Error message after ${maxApiCallRetries} trials: ${err.message}`,
          success: false
        })*/
      }
      return throwError(err)
    }),
    delay(retryDelay),
    retry(maxApiCallRetries),
    // important: do error handling after retries in epics
  )
}

/*
async function fetchImage(providedUrl: string): Promise<IFetchResult<string>> {
  let url: string;
  let hasAddedHttps: boolean;
  // on iOS we need https protocol due to App Transport Security policy 
  if (Platform.OS === 'ios' && !providedUrl.startsWith('https://')) {
    url = `https://${providedUrl.substr(7)}` // replace http:// with https://
    hasAddedHttps = true;
  } else {
    url = providedUrl;
    hasAddedHttps = false;
  }
  const path = await RNFetchBlob
    .config({ fileCache: true, })
    .fetch('GET', url)
    .then(res => {
      return res.path();
    })
    .catch(err => {
      console.error(`Error fetch image. Prefixed url with 'https://': ${(hasAddedHttps ? 'yes' : 'no')}, message: ${err.message}`)
      return '';
    });

  return {
    success: path.length > 0,
    response: path,
  };
}

function isImageFetched(path: string): Promise<boolean> {
  return RNFetchBlob.fs.exists(path);
}
*/
export interface IFetchService {
  fetchJson: <TResponse = {}> (url: string) => Observable<TResponse>;
  //fetchImage: (url: string) => Promise<IFetchResult<string>>;
  //isImageFetched: (path: string) => Promise<boolean>;
}

export const FetchService: IFetchService = { fetchJson, /*fetchImage, isImageFetched*/ };

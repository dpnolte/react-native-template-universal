import { DefaultEpic } from "../../app/store";
import { filter, switchMap, catchError, flatMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of } from "rxjs";
import { combineEpics } from "redux-observable";
import { __DEBUG__ } from "../../app/constants";
import { exampleActions } from "./actions";
import { IGithubProject } from "./models";

interface ISearchResponse {
  total_count?: number;
  incomplete_results?: false,
  items?: IGithubProject[]
}
const url = "https://api.github.com/search/repositories?sort=stars&order=desc"

export const searchEpic: DefaultEpic = (
  action$,
  state$,
  { fetchService }
) =>
  action$.pipe(
    filter(isActionOf([exampleActions.search.request])),
    switchMap(action => {      
      return fetchService.fetchJson<ISearchResponse>(`${url}&q=${action.payload}`).pipe(
        flatMap(response => {
          if (response.items) {
            return of(exampleActions.search.success(response.items))
          } else {
            console.log('no projects found')
            return of (exampleActions.search.success([]))
          }
          
        }),
        	/*
				 *  Here we placed the catchError() inside our switchMap(), but after our fetchJson call;
				 *  this is important because if we let the error reach the action$.pipe(),
				 *  it will terminate it and no longer listen for new actions.
				 */
				catchError(err => {
          const msg = `search request failed: ❌ ${err.name}: ${err.message}`
          if (__DEBUG__) {
					  console.error(msg, err)
          }
					return of(exampleActions.search.failure(msg));
				})
      )      
    }),
    catchError(err => {
      const msg = `👶🏻 search failed : ❌ ${err.name}: ${err.message}`;
      if (__DEBUG__) {
        console.error(msg);
      }
      return of(exampleActions.search.failure(msg));
    })
  );

export const exampleEpics = combineEpics(
  searchEpic
)

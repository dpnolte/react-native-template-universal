import { applyMiddleware, compose, createStore, Store } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { StateType } from 'typesafe-actions';
import { rootEpics } from './rootEpics';
import { rootReducer } from './rootReducer';
import { IFetchService, FetchService } from './services';
import { ExampleActionType } from '../../domain/example';

// export type DomainState = StateType<typeof domainReducer>
export type RootState = StateType<typeof rootReducer>
export type RootAction = ExampleActionType

export interface IServices {
  fetchService: IFetchService
}

export function configureStore(
  initialState?: object
): Store<RootState, RootAction> {
  // ======================================================
  // Middleware Configuration
  // ======================================================
  // redux-observables
  const epicMiddleware = createEpicMiddleware<
  RootAction,
  RootAction,
  RootState,
  IServices
  >({
    dependencies: {
      fetchService: FetchService
    },
  })
  const middlewares: any[] = [epicMiddleware]

  const enhancers: any[] = []
  // redux-devtools
  const windowIfDefined =
    typeof window === 'undefined' ? null : (window as any)
  const composeEnhancers =
    windowIfDefined.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store: Store<RootState, RootAction> = createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middlewares), ...enhancers)
  )

  // Make reducers hot reloadable, see https://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html
  const hot = (module as any).hot
  if (hot) {
    hot.accept(() => {
      const nextRootReducer = require('./rootReducer').rootReducer
      store.replaceReducer(nextRootReducer)
    })
  }

  // run epics after store creation
  epicMiddleware.run(rootEpics as any)
  return store
}

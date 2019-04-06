import { combineReducers } from 'redux'
import { exampleReducer } from '../../domain/example';
// import { domainReducer } from './domain'
// import { appReducer } from './app'


export const rootReducer = combineReducers({
  example: exampleReducer,
/*  app: appReducer,
  domains: domainReducer,*/
})

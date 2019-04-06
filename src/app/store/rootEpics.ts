import { combineEpics, Epic } from "redux-observable";
// import { userEpics, notificationEpics } from './domain'
// import { appEpics } from './app'
import { RootAction, RootState, IServices } from "./configureStore";
import { exampleEpics } from "../../domain/example";


export type DefaultEpic = Epic<RootAction, RootAction, RootState, IServices>;

export const rootEpics = combineEpics(
  exampleEpics,
);
/*  appEpics,
  userEpics,
  notificationEpics,*/

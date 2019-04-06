import { ActionType, createAsyncAction, createStandardAction } from 'typesafe-actions';
import { IGithubProject } from './models';

export const exampleActions = {
  search: createAsyncAction(
    'processes/SEARCH',
    'processes/SEARCH_SUCCESS',
    'processes/SEARCH_FAILURE',
  )<string, IGithubProject[], string>(), 
};
// @ts-ignore
export type ExampleActionType = ActionType<typeof processActions>;

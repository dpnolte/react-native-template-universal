import { getType } from 'typesafe-actions'


import { ExampleActionType, exampleActions } from './actions'
import { ActionState, ActionStateType } from '../../app/store';
import { IGithubProject } from './models';

export interface IExampleState {
  readonly projects: IGithubProject[];
  readonly searching: ActionStateType,
}

function reducer(
	state: IExampleState = {
    searching: ActionState.NotYetPerformed,
		projects: []
	},
	action: ExampleActionType
): IExampleState {
	switch (action.type) {
		// loading all
	case getType(exampleActions.search.request):
		return { ...state, searching: ActionState.InProgress }
  case getType(exampleActions.search.success):
		return { ...state, searching: ActionState.Success, projects: action.payload }
	case getType(exampleActions.search.failure):
		return { ...state, searching: ActionState.Failure }
	default:
		return state
	}
}

export const exampleReducer = reducer

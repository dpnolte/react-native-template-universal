import { Store, Unsubscribe } from "redux";
import { IViewModel } from "./BaseViewModel";
import { RootState } from "../store";
import { ProjectsViewModel, IProjectsViewModelState, IProjectsViewModelActions } from "../../domain/example";

export enum ViewModelKey {
  Projects='Projects',
}

export type ViewModelKeyToType = {
  [ViewModelKey.Projects]: ProjectsViewModel,
}
export type ViewModelKeyToState = {
  [ViewModelKey.Projects]: IProjectsViewModelState,
}
export type ViewModelKeyToActions = {
  [ViewModelKey.Projects]: IProjectsViewModelActions,
}

export class ViewModelManager {
  constructor(store: Store) {
    this.viewModels = {}
    this.store = store
    this.state = store.getState()
  }
  private viewModels: { [key: string]: IViewModel }
  private store: Store;
  unsubscribe: Unsubscribe | undefined;
  private state: RootState;


  registerViewModel(viewModelCreator: () => { key: ViewModelKey, viewModel: IViewModel }) {
    const { key, viewModel } = viewModelCreator()
    this.viewModels[key.toString()] = viewModel
    viewModel.bindActionCreators(this.store)
  }

  unregisterViewModels() {
    this.viewModels = {}
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  subscribe() {
    const parent = this
    this.unsubscribe = this.store.subscribe(() => {
      const newState = parent.store.getState()
      // If the value is the same, skip the unnecessary state update.
      if (newState !== parent.state) {
        parent.state = newState
        parent.onStateUpdate(newState)
      }
    })
  }

  private onStateUpdate(state: any) {
    for (const viewModel of Object.values(this.viewModels)) {
      if (viewModel.isActive === true) {
        const oldState = { ...viewModel.state }
        viewModel.bindState(state)
        if (oldState !== viewModel.state) {
          viewModel.onStateUpdate(oldState)
        }
      }
    }
  }

  getViewModel<K extends ViewModelKey>(key: K): ViewModelKeyToType[K] {
    const viewModel = this.viewModels[key.toString()] as ViewModelKeyToType[K]
    if (!viewModel) {
      throw Error(`View model with key '${key}' is not registered`)
    }
    return viewModel
  }
}
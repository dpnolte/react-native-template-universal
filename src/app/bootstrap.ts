import { ViewModelManager, ViewModelKey } from "./viewmodels/ViewModelManager";
import { Store } from "redux";
import { RootState, RootAction, configureStore } from "./store";
import { ProjectsViewModel } from "../domain/example";
import { log } from "./log/Logger";



let store: Store<RootState, RootAction> | undefined
export const getStore = (): Store<RootState, RootAction> => {
  if (store) {
    return store
  } else {
    throw Error('store is not defined')
  }
}

let viewModelManager: ViewModelManager | undefined
export const getViewModelManager = (): ViewModelManager => {
  if (viewModelManager) {
    return viewModelManager
  } else {
    throw Error('viewModelManager is not defined')
  }
}

export const boot = () => {
  log('Booting')
  store = configureStore()
  viewModelManager = createViewModelManager(store)
  log('Booted')
}

export const exit = () => {
  log('Exiting')
  if (viewModelManager) {
    clearViewModelManager(viewModelManager)
  }
  viewModelManager = undefined
  store = undefined
  log('Exited')
}

const createViewModelManager = (store: Store<RootState, RootAction>): ViewModelManager => {
  const manager = new ViewModelManager(store)
  manager.registerViewModel(() => ({ key: ViewModelKey.Projects, viewModel: new ProjectsViewModel() }))
  manager.subscribe()
  return manager
}

const clearViewModelManager = (viewModelManager: ViewModelManager) => {
  if (viewModelManager) {
    viewModelManager.unregisterViewModels()
  }
}

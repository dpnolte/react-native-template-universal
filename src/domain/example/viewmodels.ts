
import { IGithubProject } from "./models";
import { exampleActions } from "./actions";
import { RootState, ActionState } from "../../app/store";
import { BaseViewModel } from "../../app/viewmodels";

export interface IProjectsViewModelState {
  projects: IGithubProject[],
  loading: boolean;
}
export interface IProjectsViewModelActions {
  search: (query: string) => void;
}


export class ProjectsViewModel extends BaseViewModel<IProjectsViewModelState, IProjectsViewModelActions> {
  constructor() {
    super()
    this.state = {
      loading: false,
      projects: []
    }
  }
  search(query: string) {
    this.actions.search(query)
  }

  mapState(rootState: RootState): IProjectsViewModelState {
    return {
      projects: rootState.example.projects,
      loading: rootState.example.searching === ActionState.InProgress,
    }
  }

  mapActions() {
    return {
      search: exampleActions.search.request,
    }
  }

}

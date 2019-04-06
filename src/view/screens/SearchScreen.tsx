import React from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import { withViewModel } from "./withViewModel";
import { ViewModelKey } from "../../app/viewmodels";
import { IProjectsViewModelState, ProjectsViewModel, IGithubProject } from "../../domain/example";
import { SearchBar } from "../components/SearchBar";
import { GitHubProject } from "../components/GitHubProject";
import { ScreenContainer } from "../components/ScreenContainer";


interface IProps extends IProjectsViewModelState {
  viewModel: ProjectsViewModel
}
interface IState {
  enteredQuery: string;
}

class InternSearchScreen extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      enteredQuery: ''
    }
    this.onSearch = this.onSearch.bind(this)
    this.renderProjectItem = this.renderProjectItem.bind(this)
    this.extractProjectKey = this.extractProjectKey.bind(this)
  }

  private onSearch(query: string) {
    this.props.viewModel.search(query)
    this.setState({ enteredQuery: query })
  }

  private getContent() {
    const { projects } = this.props
    return (
      <React.Fragment>
        <SearchBar onPress={this.onSearch} />
        {projects && projects.length > 0 &&
          <React.Fragment>
            <Text>Search results for: '{this.state.enteredQuery}'</Text>
            <FlatList
              data={projects}
              renderItem={this.renderProjectItem}
              keyExtractor={this.extractProjectKey}
            />
          </React.Fragment>
        }
      </React.Fragment>
    )
  }

  private renderProjectItem({ item }: { item: IGithubProject}) {
    return (
      <GitHubProject project={item} />
    )
  }

  private extractProjectKey(item: IGithubProject) {
    return `project-${item.id}`
  }

  render() {
    return (
      <ScreenContainer style={styles.container}>
        <React.Fragment>
          <Text>Projects</Text>
          {this.props.loading && <Text>Loading</Text>}
          {!this.props.loading && this.getContent()}
        </React.Fragment>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5FCFF"
  }
});

export const SearchScreen = withViewModel(InternSearchScreen, ViewModelKey.Projects);

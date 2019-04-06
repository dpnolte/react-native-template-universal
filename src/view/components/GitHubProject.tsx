import React from "react";
import { StyleSheet, Text, View, Image, Button } from "react-native";
import { IGithubProject } from "../../domain/example";


interface IProps  {
  project: IGithubProject
}
interface IState {

}

export class GitHubProject extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);

  }


  render() {
    const { project } = this.props
    return (
      <View style={styles.container}>
        <View style={styles.project}>
          <Text style={styles.header}>{project.full_name}</Text>
          <Text style={styles.content}>{project.description}</Text>
        </View>          
        <View style={styles.owner}>
          <Text style={styles.content}>{project.owner.login}</Text>
          <Image
            style={styles.avatar}
            resizeMode="contain"
            source={{
              uri: project.owner.avatar_url,
              cache: 'only-if-cached'
            }} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    width: 800,    
  },
  header: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 10,
    color: '#333'
  },
  button: {
    width: 100,
  },
  owner: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 10,
  },
  project: {
    flex: 1
  },
  avatar: {    
    width: 25,
  }
});

import React from "react";
import { StyleSheet, Text, View, TextInput, Button } from "react-native";


interface IProps  {
  onPress: (query: string) => void;
}
interface IState {
  query: string;
}

export class SearchBar extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      query: ''
    }
    this.onPress = this.onPress.bind(this)
    this.onChangeText = this.onChangeText.bind(this)
  }

  private onPress() {
    this.props.onPress(this.state.query)
  }

  private onChangeText(text: string) {
    this.setState({ query: text })
  }

  render() {
    return (
      <View style={styles.container}>
          <TextInput 
            placeholder="Search for github project..."
            onChangeText={this.onChangeText}
            style={styles.textInput}
          />
          <Button
            title='Search'            
            onPress={this.onPress} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {    
    padding: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFF',
    minWidth: 150,
  },
});

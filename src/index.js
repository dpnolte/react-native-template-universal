import { AppRegistry } from "react-native";
import { App } from "./view"

AppRegistry.registerComponent('App', () => App);
AppRegistry.runApplication('App', { rootTag: document.getElementById('root') });

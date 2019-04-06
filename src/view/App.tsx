import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { boot, exit, getStore } from '../app/bootstrap';
import { IS_MOBILE } from '../app/constants';
import Routing, { Router } from '../app/routing/index';
import { SearchScreen } from './screens/SearchScreen';


const { Route } = Routing;

interface IProps {}
interface IState {
  appState: AppStateStatus,
  booted: boolean;
}
export class App extends React.Component<IProps, IState> {
    constructor(props: IProps) {
      super(props)
      this.state = {
        appState: AppState.currentState,
        booted: false,
      }
    }

    componentWillMount() {
      if (IS_MOBILE) {
        AppState.addEventListener('change', this._handleAppStateChange);
      }
      this.onBoot()
    }
    componentWillUnmount() {
      if (IS_MOBILE) {
        AppState.removeEventListener('change', this._handleAppStateChange);
      }
      this.onExit()
    }

    _handleAppStateChange = (nextAppState: AppStateStatus) => {
      const { appState, booted } = this.state
      if (
        !booted &&
        appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        this.onBoot()
      } else if (
        booted &&
        appState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        this.onExit()
      }
      this.setState({appState: nextAppState});
    };

    onBoot() {
      boot()
      this.setState({ booted: true})
    }

    onExit() {
      exit()
      this.setState({ booted: false})
    }


    render() {
        return (
          <Router>
              <Route path='/' component={SearchScreen}/>
          </Router>
        );
    }
}
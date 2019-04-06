import React from "react";
import {
  IViewModel,
  ViewModelKey,
  ViewModelKeyToType,
  ViewModelKeyToState,
} from "../../app/viewmodels";
import { getViewModelManager } from "../../app/bootstrap";
import { Subtract } from "utility-types";
import { log } from "../../app/log/Logger";

interface InjectedProps<TViewModel extends IViewModel> {
  viewModel: TViewModel;
}


export const withViewModel = <
  P extends ViewModelKeyToState[K] & InjectedProps<ViewModelKeyToType[K]> & ViewModelKeyToState[K],
  K extends ViewModelKey
>(
  Component: React.ComponentType<P>,
  key: K
) => {
  return class WithViewModel extends React.Component<
    Subtract<P, InjectedProps<ViewModelKeyToType[K]>>,
    ViewModelKeyToState[K]
  > {
    constructor(
      props: Subtract<P, InjectedProps<ViewModelKeyToType[K]>>
    ) {
      super(props);
      log(`Connecting view model: ${key.toString()}`)
      this.onStateUpdate = this.onStateUpdate.bind(this)
      this.viewModel = getViewModelManager().getViewModel(key);
      this.state = {
        ...this.viewModel.state as ViewModelKeyToState[K]
      }
      this.viewModel.addViewListener(this.onStateUpdate)
      log(`Connected view model: ${key.toString()}`)

    }
    viewModel: ViewModelKeyToType[K];

    componentWillUnmount() {
      this.viewModel.removeViewListener(this.onStateUpdate)
    }
    onStateUpdate() {
      this.setState({
        ...this.viewModel.state
      })
    }

    render() {
      return (
        <Component
          {...this.props as P}
          {...this.state}
          viewModel={this.viewModel}
        />
      );
    }
  };
};

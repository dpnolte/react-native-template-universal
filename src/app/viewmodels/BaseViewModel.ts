import { Store, bindActionCreators, ActionCreator } from "redux";
import { RootState } from "../store";
import { getStore } from "../bootstrap";
import { EventDispatcher, EventListenerType } from "../events/EventDispatcher";

export interface IViewModel<
  TRootState = any,
  TState extends IStateMap = any,
  TActions extends object = any
> {
  bindActionCreators: (store: Store) => void;
  bindState: (nextState: TRootState) => void;
  mapState?: (rootState: TRootState) => TState;
  mapActions?: () => TActions;
  onStateUpdate: (oldState: TState) => void;
  isActive: boolean;
  state: TState;
  addViewListener: (listener: EventListenerType) => void;
  removeViewListener: (listener: EventListenerType) => void;
}

interface IActionsMap {
  [actionName: string]: ActionCreator<any>;
}

interface IStateMap {
  [stateName: string]: any;
}

const EVENT_KEY_STATE_UPDATE = 'BaseViewModel/STATE_UPDATE'

export class BaseViewModel<
  TState extends IStateMap = {},
  TActions = {},
> extends EventDispatcher implements IViewModel {
  constructor() {
    super()
    this.actions = {} as TActions;
    this.state = {} as TState;

  }
  protected actions: TActions;  
  public state: TState;
  
  get isActive(): boolean{
    return this.events[EVENT_KEY_STATE_UPDATE] && this.events[EVENT_KEY_STATE_UPDATE].listeners.length > 0
  }

  addViewListener(listener: EventListenerType) {  
    this.addEventListener(EVENT_KEY_STATE_UPDATE, listener)
  }
  removeViewListener(listener: EventListenerType) {
    this.removeEventListener(EVENT_KEY_STATE_UPDATE, listener)
  }

  bindActionCreators(store: Store) {    
    const { mapActions } = this as unknown as IViewModel
    if (mapActions) {
      this.actions = bindActionCreators(mapActions(), store.dispatch);
    }
  }

  bindState(nextState: RootState) {
    const { mapState } = this as unknown as IViewModel
    if (mapState) {
      this.state = mapState(nextState)
    }
  }

  onStateUpdate() {
    this.dispatchAll(EVENT_KEY_STATE_UPDATE)
  }
}

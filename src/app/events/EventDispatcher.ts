export type EventListenerType = (event?: string) => void;


export class EventDispatcher {
  constructor() {
    this.events = {}
  }
  protected events: { [eventKey: string]: { listeners: EventListenerType[] } }

  protected addEventListener(event: string, listener: EventListenerType) {
    if (typeof listener !== 'function') {
      throw Error(`The listener callback must be a function, the given type is ${typeof listener}`);
    }
    if (typeof event !== 'string') {
        throw Error(`The event name must be a string, the given type is ${typeof event}`);
    }
        
    if (!this.events[event]) {
      this.events[event] = { listeners: [] }
    }
        
    this.events[event].listeners.push(listener);
  }

  protected removeEventListener(event: string, listener: EventListenerType) {
      if (!this.events[event]) {
        throw Error(`This event: ${event} does not exist`);
      }
      const listenerAsString = listener.toString()
      this.events[event].listeners = this.events[event].listeners.filter(l => {
          return listenerAsString !== l.toString(); 
      });
  }

  protected removeAllListeners(event: string) {
    if (!this.events[event]) {
      throw Error(`This event: ${event} does not exist`);
    }
    this.events[event].listeners = []
  }

  protected dispatchAll(event: string) {
    const { listeners } = this.events[event];
    if (listeners) {
      for (const listener of listeners) {
        this.dispatchEvent(event, listener);
      }
    }
  }

  protected dispatchEvent(event: string, listener: EventListenerType) {
    listener(event);
  }
}
import { makeSymbol } from './util';

const symEvents = makeSymbol('events');
export default class Event {
  constructor() {
    this[symEvents] = {};
  }

  on(type, handler) {
    if (!this[symEvents][type]) {
      this[symEvents][type] = [handler];
    } else {
      this[symEvents][type].push(handler);
    }

    return this;
  }

  off(type, handler) {
    if (!type) {
      this[symEvents] = {};
      return this;
    }
    if (!handler) {
      delete this[symEvents][type];
      return this;
    }

    // fast in-place element remove
    const handlers = this[symEvents][type];
    const len = handlers.length;
    let idx = 0;
    let resultLen = 0;
    while (idx < len) {
      if (handlers[idx] !== handler) {
        handlers[resultLen] = handlers[idx];
        resultLen += 1;
      }
      idx += 1;
    }
    handlers.length = resultLen;

    return this;
  }

  one(type, handler) {
    const once = (...args) => {
      this.off(type, once);
      handler.apply(this, args);
    };

    return this.on(type, once);
  }

  emit(type, ...args) {
    if (this[symEvents][type] && this[symEvents][type].length > 0) {
      this[symEvents][type].slice(0).forEach(
        handler => handler.apply(this, args),
      );
    }
    return this;
  }
}

const symEvents = Symbol('events');

function inherits(subClass, superClass) { // copied from babel
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass) {
    // eslint-disable-next-line no-unused-expressions
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      // eslint-disable-next-line no-proto
      : subClass.__proto__ = superClass;
  }
}

export default class EventEmitter {
  constructor() {
    this[symEvents] = {};
  }

  on(types, handler) {
    types.split(/ /).forEach((type) => {
      if (!this[symEvents][type]) {
        this[symEvents][type] = [handler];
      } else {
        this[symEvents][type].push(handler);
      }
    });

    return this;
  }

  off(types, handler) {
    if (!types) {
      this[symEvents] = {};
      return this;
    }
    if (!handler) {
      types.split(/ /).forEach(type => delete this[symEvents][type]);
      return this;
    }

    types.split(/ /).forEach((type) => {
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
    });

    return this;
  }

  one(types, handler) {
    const once = (...args) => {
      this.off(types, once);
      handler.apply(this, args);
    };

    return this.on(types, once);
  }

  emit(type, ...args) {
    if (this[symEvents][type] && this[symEvents][type].length > 0) {
      this[symEvents][type].slice(0).forEach(
        handler => handler.apply(this, args),
      );
    }
    return this;
  }

  // dirty method for pure vanilla (without es transpile) users to extend class
  static extend(protoMember, staticMember) {
    let SubClass;

    if (Object.prototype.hasOwnProperty.call(protoMember, 'constructor')) {
      SubClass = protoMember.constructor;
      inherits(SubClass, this);
    } else {
      SubClass = class extends this {};
    }

    Object.assign(SubClass.prototype, protoMember);
    Object.assign(SubClass, staticMember);

    return SubClass;
  }
}

import EventEmitter from 'vce/lib/emitter';

function testEmitter(emitter) {
  function die() {
    fail('this handler should not be invoked');
  }

  let x = 1;
  let y = 42;
  let z = 100;

  emitter.on('foo', () => {
    x += 1;
  });
  emitter.one('foo', () => { // one should run only once
    y += 1;
  });
  emitter.on('foo', die);
  emitter.off('foo', die); // off shoud unbind event
  emitter.emit('foo');
  emitter.emit('foo');
  emitter.emit('baz');
  emitter.emit('baz');
  expect(x).toBe(3);
  expect(y).toBe(43);

  emitter.on('bar', die);
  emitter.one('bar', die);
  emitter.on('baz', () => {
    x += 1;
  });
  emitter.on('baz', () => {
    x += 1;
  });
  emitter.on('baz', () => {
    y += 1;
  });
  emitter.off('baz'); // .off(eventName) should unbind all listener on that event
  emitter.on('baz', () => {
    z -= 1;
  });
  emitter.emit('baz');
  emitter.emit('baz');
  expect(x).toBe(3);
  expect(y).toBe(43);
  expect(z).toBe(98);

  emitter.on('foo', die);
  emitter.on('bar', die);
  emitter.on('baz', die);
  emitter.off();
  emitter.emit('foo');
  emitter.emit('bar');
  emitter.emit('baz');
}

describe('vce/lib/emitter', () => {
  it('is a constructor', () => {
    expect(typeof EventEmitter).toBe('function');
    try {
      EventEmitter();
      fail('should not be invoked directly');
    } catch (e) {
      expect(e.name).toBe('TypeError');
    }

    const emitter = new EventEmitter();

    expect(emitter instanceof EventEmitter).toBe(true);
  });

  it('has corresponding method', () => {
    'on,off,one,emit'.split(/,/).forEach(
      method => expect(typeof EventEmitter.prototype[method]).toBe('function'),
    );
    expect(typeof EventEmitter.extend).toBe('function');
  });

  it('works', () => {
    testEmitter(new EventEmitter());
  });

  it('can be extended using es class', () => {
    const obj = {};

    class MyEmitter extends EventEmitter {
      myMethod() {
        return obj;
      }

      get myProp() {
        return obj;
      }
    }

    const emitter = new MyEmitter();
    testEmitter(emitter);
    expect(emitter.myProp).toBe(obj);
    expect(emitter.myMethod()).toBe(obj);
  });

  it('can be extended using .extend method', () => {
    const obj = {};

    const MyEmitter = EventEmitter.extend(
      {
        myMethod: () => obj,

        get myProp() {
          return obj;
        },
      },
      {
        staticProp: obj,
      },
    );

    const emitter = new MyEmitter();
    testEmitter(emitter);
    expect(emitter.myProp).toBe(obj);
    expect(emitter.myMethod()).toBe(obj);
    expect(MyEmitter.staticProp).toBe(obj);
  });
});

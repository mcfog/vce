import { makeSymbol } from './util';
import Event from './event';

const symComponent = makeSymbol('component');
const symRoot = makeSymbol('root');
const symChildren = makeSymbol('children');
const map = Array.prototype.map;

export class VComponent extends Event {
  constructor(root) {
    super();

    if (VComponent.get(root)) {
      throw new Error('cannot construct twice');
    }
    this[symRoot] = root;
    this[symRoot][symComponent] = this;
    this[symChildren] = {};
    VComponent.render(root).then((children) => {
      children.forEach((child) => {
        const name = child.name
          || child[symRoot].dataset.vceName
          || child[symRoot].dataset.vce;
        this[symChildren][name] = this[symChildren][name] || [];
        this[symChildren][name].push(child);
      });

      this.init();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  init() {}

  get root() {
    return this[symRoot];
  }

  get children() {
    return this[symChildren];
  }

  static render(root = document) {
    return Promise.all(map.call(root.querySelectorAll('[data-vce]'), el =>
      Promise.resolve(VComponent.loader(el.dataset.vce)).then(C => ({ C, el })),
    )).then(components => components.map(
      ({ C, el }) => VComponent.get(el) || new C(el)),
    );
  }

  static get(el) {
    return el[symComponent];
  }

  static extend(proto) {
    class MyComponent extends this {}

    Object.assign(MyComponent.prototype, proto);

    return MyComponent;
  }

  static loader(name) {
    return VComponent.components[name];
  }
}

VComponent.components = {};

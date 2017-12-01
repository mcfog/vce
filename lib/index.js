import { delegate } from './util';
import EventEmitter from './emitter';

const symComponent = Symbol('component');
const symRoot = Symbol('root');
const symChildren = Symbol('children');
const symInitChildren = Symbol('init-children');
const map = Array.prototype.map;

function findParent(child) {
  let ancestor = child.root;
  while (ancestor = ancestor.parentNode) {
    if (ancestor[symComponent]) {
      return ancestor[symComponent];
    }
  }

  return null;
}

export class VComponent extends EventEmitter {
  constructor(root) {
    super();

    if (VComponent.get(root)) {
      throw new Error('cannot construct twice');
    }
    this[symRoot] = root;
    this[symRoot][symComponent] = this;
    this[symChildren] = {};
    this.name = this[symRoot].dataset.vceName
      || this.name
      || this.constructor.vceName
      || this[symRoot].dataset.vce;

    this.renderChildren()
      .then(this.bindDomEvents.bind(this))
      .then(this.init.bind(this));
  }

  removeChild(child) {
    const name = child.name;
    const idx = this[symChildren][name].indexOf(child);
    if (idx === -1) {
      throw new Error('child not found');
    }

    child.off();
    child.root.parentNode.removeChild(child.root);
    this[symChildren][name].splice(idx, 1);
  }

  renderChildren() {
    return VComponent.render(this.root).then(
      this[symInitChildren].bind(this),
    );
  }

  [symInitChildren](children) {
    const myChildren = {};
    children.forEach((child) => {
      if (findParent(child) !== this) {
        return;
      }

      const name = child.name;
      myChildren[name] = myChildren[name] || [];
      if (myChildren[name].indexOf(child) === -1) {
        myChildren[name].push(child);
      }
    });

    this[symChildren] = myChildren;
  }

  createChild(childElement) {
    if (typeof childElement === 'string') {
      childElement = this.qs(childElement);
    }
    if (!this.root.contains(childElement)) {
      throw new Error('cannot find child element');
    }
    const child = VComponent.get(childElement);
    if (child) {
      return Promise.resolve(child);
    }

    return VComponent.create(childElement).then((newChild) => {
      const parent = findParent(newChild);
      parent[symChildren][newChild.name] =
        parent[symChildren][newChild.name] || [];
      parent[symChildren][newChild.name].push(newChild);

      return newChild;
    });
  }

  qs(sel) {
    return this.root.querySelector(sel);
  }

  qsa(sel) {
    return this.root.querySelectorAll(sel);
  }

  qsChild(sel) {
    return VComponent.get(this.qs(sel));
  }

  qsChildren(sel) {
    const children = [];
    this.qsa(sel).forEach((el) => {
      const child = VComponent.get(el);
      if (child) {
        children.push(child);
      }
    });

    return children;
  }

  replaceRoot(root) {
    const parent = this.root.parentNode;
    parent.insertBefore(root, this.root);
    parent.removeChild(this.root);

    delete this.root[symComponent];
    this[symRoot] = root;
    root[symComponent] = this;

    return this.renderChildren()
      .then(this.bindDomEvents.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  init() {}

  bindDomEvents() {
    if (this.events) {
      this.events.forEach((args) => {
        if (typeof args === 'string') {
          this.listen(...args.split(/\//));
        } else {
          this.listen(...args);
        }
      });
    }
  }

  listen(type, el, handler, useCapture) {
    type = typeof type === 'string' ? type.split(/ /) : type;
    handler = typeof handler === 'function'
      ? handler.bind(this)
      : this[handler].bind(this);

    type.forEach((eventName) => {
      if (el === '@root') {
        this.root.addEventListener(
          eventName,
          handler,
          !!useCapture,
        );
      } else if (typeof el === 'string') { // delegate
        delegate(this.root, el, eventName, handler, useCapture);
      } else {
        el.addEventListener(
          eventName,
          handler,
          !!useCapture,
        );
      }
    });

    return this;
  }

  get root() {
    return this[symRoot];
  }

  get children() {
    return this[symChildren];
  }

  static render(root = document) {
    return Promise.all(map.call(root.querySelectorAll('[data-vce]'), el =>
      this.create(el),
    ));
  }

  static create(el) {
    return Promise.resolve(this.loader(el.dataset.vce))
      .then(C => this.get(el) || new C(el));
  }

  static get(el) {
    return el[symComponent];
  }

  static loader(name) {
    return this.components[name];
  }
}

VComponent.components = {};

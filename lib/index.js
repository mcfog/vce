import { delegate } from './util';
import EventEmitter from './emitter';

const symComponent = Symbol('component');
const symRoot = Symbol('root');
const symChildren = Symbol('children');
const symInitChildren = Symbol('init-children');
const symRenderingRoot = Symbol('rendering-root');
const symListeners = Symbol('listeners');
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
    this[symListeners] = [];
    this.name = this[symRoot].dataset.vceName
      || this.name
      || this.constructor.vceName
      || this[symRoot].dataset.vce;

    this.initPromise = this.renderChildren()
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
    if (VComponent[symRenderingRoot] && VComponent[symRenderingRoot].contains(this.root)) {
      const children = map.call(this.qsa('[data-vce]'), el => VComponent.get(el));
      return Promise.resolve(this[symInitChildren](children));
    }

    return this.constructor.render(this.root).then(
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
    const el = this.qs(sel);
    return el ? VComponent.get(el) : null;
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
    this.destroyListeners();

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
        this[symListeners].push([this.root, eventName, handler, !!useCapture]);
      } else if (typeof el === 'string') { // delegate
        this[symListeners].push(delegate(this.root, el, eventName, handler, useCapture));
      } else {
        el.addEventListener(
          eventName,
          handler,
          !!useCapture,
        );
        this[symListeners].push([el, eventName, handler, !!useCapture]);
      }
    });

    return this;
  }

  destroyListeners() {
    this[symListeners].forEach(([el, ...args]) => el.removeEventListener(...args));
    this[symListeners] = [];
  }

  get root() {
    return this[symRoot];
  }

  get children() {
    return this[symChildren];
  }

  static render(root = document) {
    if (VComponent[symRenderingRoot]) {
      throw new Error('render process conflict');
    }

    VComponent[symRenderingRoot] = root;

    // reverse children creation so descendant is created first
    const list = root.querySelectorAll('[data-vce]');
    const promises = [];
    let i = list.length - 1;
    while (i >= 0) {
      promises.push(this.create(list[i]));
      i -= 1;
    }

    return Promise.all(promises).then((components) => {
      delete VComponent[symRenderingRoot];
      return components;
    }, (err) => {
      delete VComponent[symRenderingRoot];
      return Promise.reject(err);
    });
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

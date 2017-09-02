import { makeSymbol } from './util';
import EventEmitter from './emitter';

const symComponent = makeSymbol('component');
const symRoot = makeSymbol('root');
const symChildren = makeSymbol('children');
const map = Array.prototype.map;

export class VComponent extends EventEmitter {
  constructor(root) {
    super();

    if (this.constructor.get(root)) {
      throw new Error('cannot construct twice');
    }
    this[symRoot] = root;
    this[symRoot][symComponent] = this;
    this[symChildren] = {};
    if (!this.name) {
      this.name = this[symRoot].dataset.vceName || this[symRoot].dataset.vce;
    }

    this.scanChildren()
      .then(this.bindDomEvents.bind(this))
      .then(this.init.bind(this));
  }

  removeChild(child) {
    const name = child.name;
    const idx = this.children[name].indexOf(child);
    if (idx === -1) {
      throw new Error('child not found');
    }

    child.off();
    child.root.parentNode.removeChild(child.root);
    this.children[name].splice(idx, 1);
  }

  scanChildren() {
    return this.constructor.render(this.root).then(
      this.populateChildren.bind(this),
    );
  }

  populateChildren(children) {
    const myChildren = {};
    children.forEach((child) => {
      const name = child.name;
      myChildren[name] = myChildren[name] || [];
      myChildren[name].push(child);
    });

    this[symChildren] = myChildren;
  }

  renderChildElement(childElement) {
    if (typeof childElement === 'string') {
      childElement = this.root.querySelector(childElement);
    }
    if (!this.root.contains(childElement)) {
      throw new Error('cannot find child element');
    }
    const child = this.constructor.get(childElement);
    if (child) {
      return Promise.resolve(child);
    }

    return this.constructor.renderElement(childElement).then((newChild) => {
      this.children[newChild.name] = this.children[newChild.name] || [];
      this.children[newChild.name].push(newChild);
      return newChild;
    });
  }

  qs(sel) {
    return this.root.querySelector(sel);
  }

  qsa(sel) {
    return this.root.querySelectorAll(sel);
  }

  replaceRoot(root) {
    const parent = this.root.parentNode;
    parent.insertBefore(root, this.root);
    parent.removeChild(this.root);
    this[symRoot] = root;
    this.bindDomEvents();
  }

  // eslint-disable-next-line class-methods-use-this
  init() {}

  // eslint-disable-next-line class-methods-use-this
  bindDomEvents() {}

  get root() {
    return this[symRoot];
  }

  get children() {
    return this[symChildren];
  }

  static render(root = document) {
    return Promise.all(map.call(root.querySelectorAll('[data-vce]'), (el) =>
      this.renderElement(el),
    ));
  }

  static renderElement(el) {
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

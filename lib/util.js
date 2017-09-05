export function makeSymbol(name) {
  return Symbol
    ? Symbol(`vce-${name}`)
    : `_vce_${name}_${Math.random().tostring(16)}`;
}

export function delegate(root, sel, eventName, handler, useCapture) {
  function capture(event) {
    const elements = root.querySelectorAll(sel);
    const target = event.target;
    if (Array.prototype.indexOf.call(elements, target) !== -1) {
      handler.call(this, event);
    }
  }

  root.addEventListener(
    eventName,
    capture,
    !!useCapture || {
      focus: true,
      blur: true,
    }[eventName],
  );
}

export function delegate(root, sel, eventName, handler, useCapture) {
  function capture(event) {
    const target = event.target;
    const closest = target.closest(sel);
    if (closest && root.contains(closest)) {
      handler.call(this, new Proxy(event, {
        get(obj, key) {
          if (key === 'currentTarget') {
            return closest;
          }
          if (key === 'originalEvent') {
            return obj;
          }
          if (typeof obj[key] === 'function') {
            return obj[key].bind(obj);
          }

          return obj[key];
        },
      }));
    }
  }

  const shouldUseCapture = !!useCapture || {
    focus: true,
    blur: true,
  }[eventName];

  root.addEventListener(
    eventName,
    capture,
    shouldUseCapture,
  );

  return [root, eventName, capture, shouldUseCapture];
}

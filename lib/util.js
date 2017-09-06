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
          return obj[key];
        },
      }));
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

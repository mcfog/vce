export function makeSymbol(name) {
  return Symbol
    ? Symbol(`vce-${name}`)
    : `_vce_${name}_${Math.random().tostring(16)}`;
}

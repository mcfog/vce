/* eslint-disable no-unused-vars */
function setupHtml(html) {
  let container = document.getElementById('vce-test-container');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('vce-test-container');
    document.body.appendChild(container);
  }
  container.innerHTML = html;
}

console.profile('cause of reload');

window.addEventListener('beforeunload', function () {
  console.profileEnd('cause of reload');
  debugger;
});

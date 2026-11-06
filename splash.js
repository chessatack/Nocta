// Hide the splash screen once the app has rendered.
(function () {
  var s = document.getElementById('splash');
  function hide() { if (!s) return; s.style.opacity = '0'; setTimeout(function () { s && s.remove(); }, 400); }
  var root = document.getElementById('root');
  if (root && root.children.length) hide();
  else new MutationObserver(function (_m, o) { if (root.children.length) { o.disconnect(); setTimeout(hide, 150); } }).observe(root, { childList: true });
  setTimeout(hide, 4000);
})();

// TypeDoc's base points to the documentation root, including on nested API pages.
const guideLink = document.querySelector('#tsd-toolbar-links a[href="../"]');
if (guideLink) {
  const docsRoot = new URL(document.documentElement.dataset.base || "./", window.location.href);
  guideLink.href = new URL("../", docsRoot).href;
}

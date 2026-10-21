// Several charts use the same data file, so each file is downloaded once
// and the result is shared between them.
const baseLoader = vega.loader();
const loads = new Map();
const loader = Object.create(baseLoader);
loader.load = (uri, opt) => {
  const key = uri + "|" + (opt && opt.response);
  if (!loads.has(key)) loads.set(key, baseLoader.load(uri, opt));
  return loads.get(key);
};

const options = {
  actions: false,
  renderer: "svg",
  config: "charts/theme.json",
  loader
};

// Start downloading every spec and the data it uses straight away,
// while the fonts are still loading.
const slots = [...document.querySelectorAll("[data-chart]")];
const specs = new Map();
for (const slot of slots) {
  const url = `charts/${slot.dataset.chart}.vg.json`;
  const spec = loader.load(url).then(JSON.parse);
  spec.then((json) => {
    for (const [, dataUrl] of JSON.stringify(json).matchAll(/"url":"([^"]+)"/g)) {
      const response = /\.(topo)?json$/.test(dataUrl) ? "json" : "text";
      loader.load(dataUrl, {response}).catch(() => {});
    }
  }).catch(() => {});
  specs.set(slot, spec);
}
loader.load(options.config).catch(() => {});

// Draw each chart only when it comes close to the screen. Text is measured
// when a chart is drawn, so drawing waits for the fonts.
const draw = (slot) => {
  specs.get(slot)
    .then((spec) => vegaEmbed(slot, spec, options))
    .catch(console.error);
};

document.fonts.ready.then(() => {
  if (!("IntersectionObserver" in window)) {
    slots.forEach(draw);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      draw(entry.target);
    }
  }, {rootMargin: "800px 0px"});
  slots.forEach((slot) => observer.observe(slot));
});

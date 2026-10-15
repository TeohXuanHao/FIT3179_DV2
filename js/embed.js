const options = {
  actions: false,
  renderer: "svg",
  config: "charts/theme.json"
};

document.fonts.ready.then(() => {
  document.querySelectorAll("[data-chart]").forEach((slot) => {
    vegaEmbed(slot, `charts/${slot.dataset.chart}.vg.json`, options).catch(console.error);
  });
});

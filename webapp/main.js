// Bootstrap loop using split files
(function(){
  const { step, state, P } = window.PopSim;
  const { renderAll } = window.PopSimUI;
  function loop(){
    if (!state.paused) step();
    renderAll();
    setTimeout(loop, P.speedMs);
  }
  loop();
})();

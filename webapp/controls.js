// Keyboard controls
(function(){
  const { state, P } = window.PopSim;
  function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }

  window.addEventListener('keydown', (e) => {
    if (e.key === ' '){ state.paused = !state.paused; e.preventDefault(); return; }
    if (e.key === 'r'){ state.sp = window.PopSim.state.sp = window.PopSim.state.sp.map((s,i)=>({
      name: s.name, sym: s.sym,
      pop: [300,80,20,10,5][i], growth: [0.45,0.28,0.20,0.18,0.16][i], death: [0.04,0.09,0.11,0.12,0.13][i],
      last_g:0,last_d:0,last_gr:0,last_dr:0
    })); state.sun = 200; state.t = 0; state.log = []; state.hist = []; return; }
    if (e.key === 'Tab'){ state.selected = (state.selected + 1) % state.sp.length; e.preventDefault(); return; }
    if (e.key === 'ArrowUp'){ state.selected = (state.selected - 1 + state.sp.length) % state.sp.length; return; }
    if (e.key === 'ArrowDown'){ state.selected = (state.selected + 1) % state.sp.length; return; }
    if (e.key === 'n'){ P.noise = !P.noise; return; }
    if (e.key === '-' ){ P.speedMs = clamp(P.speedMs + 20, 0, 1000); return; }
    if (e.key === '+' || e.key === '='){ P.speedMs = clamp(P.speedMs - 20, 0, 1000); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
      const sp = state.sp[state.selected]; const delta = (e.key === 'ArrowLeft')? -0.01 : 0.01; sp.growth = Math.max(0, sp.growth + delta); return;
    }
    if (e.key === '[' || e.key === ']'){
      const sp = state.sp[state.selected]; const delta = (e.key === '[')? -0.01 : 0.01; sp.death = Math.max(0, sp.death + delta); return;
    }
    if (e.key === 'Enter'){
      state.sp[state.selected].pop += 10; return;
    }
  });
})();

// Simulation model (no DOM)
window.PopSim = (function(){
  const P = {
    dt: 0.1,
    solar_input: 50,
    S_max: 500,
    noise: false,
    speedMs: 50,
    b_g_h: 0.006, e_g_h: 0.20,
    b_h_f: 0.004, e_h_f: 0.18,
    b_f_s: 0.003, e_f_s: 0.16,
    b_s_e: 0.002, e_s_e: 0.14,
    k_grass_hopper_death: 0.0005,
  };
  function makeSpecies(){
    return [
      { name: 'Grass',        sym: '.', pop: 200, growth: 0.5,  death: 0.05, last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Grasshoppers', sym: 'h', pop: 60,  growth: 0.30, death: 0.10, last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Frogs',        sym: 'f', pop: 25,  growth: 0.22, death: 0.12, last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Snakes',       sym: 's', pop: 12,  growth: 0.20, death: 0.14, last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Eagles',       sym: 'e', pop: 6,   growth: 0.18, death: 0.15, last_g:0, last_d:0, last_gr:0, last_dr:0 },
    ];
  }
  const state = {
    t: 0,
    sun: 200,
    sp: makeSpecies(),
    paused: false,
    selected: 0,
    log: [],
    lastBucket: -1,
    hist: [], // rolling history of populations
  };
  function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
  function randf(a,b){ return a + Math.random()*(b-a); }
  function fmt(v, n){ return (+v).toFixed(n); }

  function pushLog(msg){
    state.log.push(`t=${fmt(state.t,1)} ${msg}`);
    if (state.log.length > 9) state.log.shift();
  }
  function step(){
    const dt = P.dt;
    const nf = P.noise ? randf(0.98, 1.02) : 1.0;
    const sp = state.sp.map(o => ({...o}));
    const grass = sp[0], hop = sp[1], frog = sp[2], snake = sp[3], eagle = sp[4];

    let sunlight = Math.min(P.S_max, state.sun + P.solar_input*dt);
    const sunlight_level = Math.max(0, Math.min(1, sunlight / Math.max(1e-6, P.S_max)));

    const grass_uptake = Math.min(sunlight, (grass.growth * sunlight_level) * grass.pop * dt);
    sunlight -= grass_uptake;
    const hopper_pressure = P.k_grass_hopper_death * hop.pop * dt;
    const grass_nat_death = grass.death * grass.pop * dt;
    grass.last_g = grass_uptake;
    grass.last_d = Math.min(grass.pop, grass_nat_death + hopper_pressure);
    let d_grass = grass.last_g - grass.last_d;

    let hop_intake = P.b_g_h * grass.pop * hop.pop * nf * dt; hop_intake = Math.min(hop_intake, grass.pop);
    d_grass -= hop_intake;
    hop.last_g = P.e_g_h * hop_intake;
    hop.last_d = hop.death * hop.pop * dt;
    let d_hop = hop.last_g - hop.last_d;

    let frog_intake = P.b_h_f * hop.pop * frog.pop * nf * dt; frog_intake = Math.min(frog_intake, hop.pop);
    d_hop -= frog_intake;
    frog.last_g = P.e_h_f * frog_intake;
    frog.last_d = frog.death * frog.pop * dt;
    let d_frog = frog.last_g - frog.last_d;

    let snake_intake = P.b_f_s * frog.pop * snake.pop * nf * dt; snake_intake = Math.min(snake_intake, frog.pop);
    d_frog -= snake_intake;
    snake.last_g = P.e_f_s * snake_intake;
    snake.last_d = snake.death * snake.pop * dt;
    let d_snake = snake.last_g - snake.last_d;

    let eagle_intake = P.b_s_e * snake.pop * eagle.pop * nf * dt; eagle_intake = Math.min(eagle_intake, snake.pop);
    d_snake -= eagle_intake;
    eagle.last_g = P.e_s_e * eagle_intake;
    eagle.last_d = eagle.death * eagle.pop * dt;
    let d_eagle = eagle.last_g - eagle.last_d;

    grass.pop = Math.max(0, grass.pop + d_grass);
    hop.pop   = Math.max(0, hop.pop   + d_hop);
    frog.pop  = Math.max(0, frog.pop  + d_frog);
    snake.pop = Math.max(0, snake.pop + d_snake);
    eagle.pop = Math.max(0, eagle.pop + d_eagle);

    for (const s of sp){
      const denom = Math.max(1.0, s.pop);
      s.last_gr = (s.last_g / denom) / Math.max(1e-6, dt);
      s.last_dr = (s.last_d / denom) / Math.max(1e-6, dt);
    }

    state.sp = sp;
    state.sun = sunlight;
    state.t += dt;

    // push history snapshot (keep last 240 points ≈ ~12s at 50ms)
    state.hist.push(sp.map(s => s.pop));
    if (state.hist.length > 400) state.hist.shift();

    const bucket = Math.floor(state.t / 5);
    if (bucket !== state.lastBucket){
      const max_g = [...sp].sort((a,b)=>b.last_gr - a.last_gr)[0];
      const max_d = [...sp].sort((a,b)=>b.last_dr - a.last_dr)[0];
      pushLog(`highest growth rate: ${max_g.name}: ${fmt(max_g.last_gr,2)}. highest death rate ${max_d.name}: ${fmt(max_d.last_dr,2)}`);
      state.lastBucket = bucket;
    }
  }

  return { P, state, step, clamp, fmt };
})();

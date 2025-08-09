// Simulation model (no DOM)
window.PopSim = (function(){
  const P = {
    dt: 0.1,
    solar_input: 50,
    S_max: 500,
    noise: false,
    speedMs: 50,
    // interaction efficiencies (prey->predator)
    b_p_r: 0.006, e_p_r: 0.22, // Plants -> Rabbits
    b_r_f: 0.004, e_r_f: 0.20, // Rabbits -> Foxes
    b_f_w: 0.003, e_f_w: 0.18, // Foxes  -> Wolves
    b_w_b: 0.002, e_w_b: 0.16, // Wolves  -> Bears
    k_plants_rabbit_death: 0.00035, // herbivory pressure on plants
  };
  function makeSpecies(){
    return [
      { name: 'Plants',  sym: '.', pop: 300, growth: 0.45, death: 0.04, maxAge: 1,  eats: '',           last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Rabbits', sym: 'r', pop: 80,  growth: 0.28, death: 0.09, maxAge: 6,  eats: 'Plants',     last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Foxes',   sym: 'f', pop: 20,  growth: 0.20, death: 0.11, maxAge: 8,  eats: 'Rabbits',    last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Wolves',  sym: 'w', pop: 10,  growth: 0.18, death: 0.12, maxAge: 12, eats: 'Foxes',      last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Bears',   sym: 'b', pop: 5,   growth: 0.16, death: 0.13, maxAge: 20, eats: 'Wolves',     last_g:0, last_d:0, last_gr:0, last_dr:0 },
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
    const plants = sp[0], rabbit = sp[1], fox = sp[2], wolf = sp[3], bear = sp[4];

    let sunlight = Math.min(P.S_max, state.sun + P.solar_input*dt);
    const sunlight_level = Math.max(0, Math.min(1, sunlight / Math.max(1e-6, P.S_max)));

    const plant_uptake = Math.min(sunlight, (plants.growth * sunlight_level) * plants.pop * dt);
    sunlight -= plant_uptake;
    const herbivory = P.k_plants_rabbit_death * rabbit.pop * dt;
    const plant_nat_death = plants.death * plants.pop * dt;
    plants.last_g = plant_uptake;
    plants.last_d = Math.min(plants.pop, plant_nat_death + herbivory);
    let d_plants = plants.last_g - plants.last_d;

    let rabbit_intake = P.b_p_r * plants.pop * rabbit.pop * nf * dt; rabbit_intake = Math.min(rabbit_intake, plants.pop);
    d_plants -= rabbit_intake;
    rabbit.last_g = P.e_p_r * rabbit_intake;
    rabbit.last_d = rabbit.death * rabbit.pop * dt;
    let d_rabbit = rabbit.last_g - rabbit.last_d;

    let fox_intake = P.b_r_f * rabbit.pop * fox.pop * nf * dt; fox_intake = Math.min(fox_intake, rabbit.pop);
    d_rabbit -= fox_intake;
    fox.last_g = P.e_r_f * fox_intake;
    fox.last_d = fox.death * fox.pop * dt;
    let d_fox = fox.last_g - fox.last_d;

    let wolf_intake = P.b_f_w * fox.pop * wolf.pop * nf * dt; wolf_intake = Math.min(wolf_intake, fox.pop);
    d_fox -= wolf_intake;
    wolf.last_g = P.e_f_w * wolf_intake;
    wolf.last_d = wolf.death * wolf.pop * dt;
    let d_wolf = wolf.last_g - wolf.last_d;

    let bear_intake = P.b_w_b * wolf.pop * bear.pop * nf * dt; bear_intake = Math.min(bear_intake, wolf.pop);
    d_wolf -= bear_intake;
    bear.last_g = P.e_w_b * bear_intake;
    bear.last_d = bear.death * bear.pop * dt;
    let d_bear = bear.last_g - bear.last_d;

    plants.pop = Math.max(0, plants.pop + d_plants);
    rabbit.pop = Math.max(0, rabbit.pop + d_rabbit);
    fox.pop    = Math.max(0, fox.pop    + d_fox);
    wolf.pop   = Math.max(0, wolf.pop   + d_wolf);
    bear.pop   = Math.max(0, bear.pop   + d_bear);

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

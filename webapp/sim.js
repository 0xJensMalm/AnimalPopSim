// Simulation model (no DOM)
window.PopSim = (function(){
  const P = {
    dt: 0.1,
    solar_input: 50,
    S_max: 500,
    noise: false,
    speedMs: 50,
    // interaction efficiencies (prey->predator)
    // Plants -> Rabbits / Insects
    b_p_r: 0.006, e_p_r: 0.22,
    b_p_i: 0.005, e_p_i: 0.20,
    // Rabbits -> Foxes
    b_r_f: 0.004, e_r_f: 0.20,
    // Insects -> Birds
    b_i_bi: 0.004, e_i_bi: 0.20,
    // Rabbits & Foxes -> Eagles (apex)
    b_r_e: 0.003, e_r_e: 0.18,
    b_f_e: 0.0025, e_f_e: 0.18,
    // plant consumption pressure from herbivores (scaled per herbivore)
    k_plants_r: 0.00030,
    k_plants_i: 0.00022,
    // additional age-related mortality for eagles
    k_eagle_old: 0.015,
  };
  function makeSpecies(){
    return [
      { name: 'Plants',  sym: '.', pop: 320, growth: 0.50, death: 0.04, maxAge: 1,  eats: '',           last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Rabbits', sym: 'r', pop: 70,  growth: 0.26, death: 0.10, maxAge: 6,  eats: 'Plants',     last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Insects', sym: 'i', pop: 90,  growth: 0.30, death: 0.10, maxAge: 2,  eats: 'Plants',     last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Foxes',   sym: 'f', pop: 18,  growth: 0.20, death: 0.11, maxAge: 8,  eats: 'Rabbits',    last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Birds',   sym: 'b', pop: 22,  growth: 0.22, death: 0.11, maxAge: 6,  eats: 'Insects',    last_g:0, last_d:0, last_gr:0, last_dr:0 },
      { name: 'Eagles',  sym: 'e', pop: 8,   growth: 0.18, death: 0.12, maxAge: 14, eats: 'Rabbits,Foxes', last_g:0, last_d:0, last_gr:0, last_dr:0 },
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
    const plants = sp[0], rabbit = sp[1], insect = sp[2], fox = sp[3], bird = sp[4], eagle = sp[5];

    let sunlight = Math.min(P.S_max, state.sun + P.solar_input*dt);
    const sunlight_level = Math.max(0, Math.min(1, sunlight / Math.max(1e-6, P.S_max)));

    const plant_uptake = Math.min(sunlight, (plants.growth * sunlight_level) * plants.pop * dt);
    sunlight -= plant_uptake;
    const herbivory = (P.k_plants_r * rabbit.pop + P.k_plants_i * insect.pop) * dt;
    const plant_nat_death = plants.death * plants.pop * dt;
    plants.last_g = plant_uptake;
    plants.last_d = Math.min(plants.pop, plant_nat_death + herbivory);
    let d_plants = plants.last_g - plants.last_d;

    let rabbit_intake = P.b_p_r * plants.pop * rabbit.pop * nf * dt; rabbit_intake = Math.min(rabbit_intake, plants.pop);
    d_plants -= rabbit_intake;
    rabbit.last_g = P.e_p_r * rabbit_intake;
    rabbit.last_d = rabbit.death * rabbit.pop * dt;
    let d_rabbit = rabbit.last_g - rabbit.last_d;

    // Insects eat plants
    let insect_intake = P.b_p_i * plants.pop * insect.pop * nf * dt; insect_intake = Math.min(insect_intake, plants.pop);
    d_plants -= insect_intake;
    insect.last_g = P.e_p_i * insect_intake;
    insect.last_d = insect.death * insect.pop * dt;
    let d_insect = insect.last_g - insect.last_d;

    // Foxes eat rabbits
    let fox_intake = P.b_r_f * rabbit.pop * fox.pop * nf * dt; fox_intake = Math.min(fox_intake, rabbit.pop);
    d_rabbit -= fox_intake;
    fox.last_g = P.e_r_f * fox_intake;
    fox.last_d = fox.death * fox.pop * dt;
    let d_fox = fox.last_g - fox.last_d;

    // Birds eat insects
    let bird_intake = P.b_i_bi * insect.pop * bird.pop * nf * dt; bird_intake = Math.min(bird_intake, insect.pop);
    d_insect -= bird_intake;
    bird.last_g = P.e_i_bi * bird_intake;
    bird.last_d = bird.death * bird.pop * dt;
    let d_bird = bird.last_g - bird.last_d;

    // Eagles eat rabbits and foxes; plus old-age mortality
    let eagle_intake_r = P.b_r_e * rabbit.pop * eagle.pop * nf * dt; eagle_intake_r = Math.min(eagle_intake_r, rabbit.pop);
    d_rabbit -= eagle_intake_r;
    let eagle_intake_f = P.b_f_e * fox.pop * eagle.pop * nf * dt; eagle_intake_f = Math.min(eagle_intake_f, fox.pop);
    d_fox -= eagle_intake_f;
    const eagle_intake = eagle_intake_r + eagle_intake_f;
    eagle.last_g = (P.e_r_e * eagle_intake_r) + (P.e_f_e * eagle_intake_f);
    const eagle_old = P.k_eagle_old * eagle.pop * dt;
    eagle.last_d = eagle.death * eagle.pop * dt + eagle_old;
    let d_eagle = eagle.last_g - eagle.last_d;

    plants.pop = Math.max(0, plants.pop + d_plants);
    rabbit.pop = Math.max(0, rabbit.pop + d_rabbit);
    insect.pop = Math.max(0, insect.pop + d_insect);
    fox.pop    = Math.max(0, fox.pop    + d_fox);
    bird.pop   = Math.max(0, bird.pop   + d_bird);
    eagle.pop  = Math.max(0, eagle.pop  + d_eagle);

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

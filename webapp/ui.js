// UI rendering into #stats, #species, #log, #mix
(function(){
  const { state, P, fmt } = window.PopSim;
  const elStats = document.getElementById('stats');
  const elSpList = document.getElementById('species-list');
  const elSpInfo = document.getElementById('species-info');
  const btnAdd1 = document.getElementById('btn-add-1');
  const btnAdd10 = document.getElementById('btn-add-10');
  const btnAdd100 = document.getElementById('btn-add-100');
  const elLog = document.getElementById('log');
  const elViz = document.getElementById('viz');
  const tabMix = document.getElementById('tab-mix');
  const tabGraph = document.getElementById('tab-graph');
  let activeTab = 'mix';

  function padRight(s, n){ s = String(s); return s.length >= n ? s.slice(0,n) : s + ' '.repeat(n - s.length); }
  function padLeft(s, n){ s = String(s); return s.length >= n ? s.slice(0,n) : ' '.repeat(n - s.length) + s; }
  function headerRow(){
    return `Sel Name           pop     gRate    dRate    last+     last-`;
  }

  function renderStats(){
    const total = state.sp.reduce((a,b)=>a+b.pop,0);
    const animals = state.sp.slice(1).reduce((a,b)=>a+b.pop,0);
    const lines = [];
    lines.push(`Time: ${fmt(state.t,2)}  ${state.paused? '<span class="fg-hop">PAUSED</span>':'<span class="fg-grass">RUNNING</span>'}`);
    lines.push(`Total biomass: <span class="fg-accent">${fmt(total,2)}</span>`);
    lines.push(`Sunlight:      <span class="fg-accent">${fmt(state.sun,2)}</span>/${P.S_max}`);
    lines.push(`Animals total: <span class="fg-accent">${fmt(animals,2)}</span>`);
    lines.push(`dt: ${fmt(P.dt,3)}  speed: <span class="fg-accent">${P.speedMs}ms</span>  noise:${P.noise?'<span class="fg-accent">ON</span>':'<span class="fg-dim">OFF</span>'}`);
    elStats.innerHTML = lines.join('\n');
  }

  function colorClass(i){
    return i===0? 'fg-grass'   // Plants
         : i===1? 'fg-hop'     // Rabbits
         : i===2? 'fg-insect'  // Insects
         : i===3? 'fg-frog'    // Foxes
         : i===4? 'fg-bird'    // Birds
         : 'fg-eagle';         // Eagles
  }

  function renderSpecies(){
    if (elSpList && elSpInfo){
      const rows = [];
      rows.push(headerRow());
      for (let i=0;i<state.sp.length;i++){
        const s = state.sp[i];
        const sel = (i === (state.selected ?? 0)) ? '>' : ' ';
        const name = padRight(s.name, 14);
        const pop = padLeft(fmt(Math.round(s.pop),0), 6);
        const gr = padLeft(fmt(s.last_gr,3), 7);
        const dr = padLeft(fmt(s.last_dr,3), 7);
        const lg = padLeft(fmt(s.last_g,2), 8);
        const ld = padLeft(fmt(s.last_d,2), 8);
        rows.push(`${sel} ${name} ${pop}  ${gr}  ${dr}  ${lg}  ${ld}`);
      }
      elSpList.textContent = rows.join('\n');
      renderSpeciesDetail(state.selected ?? 0);
      return;
    }
    // Fallback to legacy grid if list/info not present
    const elSpGrid = document.getElementById('species-grid');
    const elSpDetail = document.getElementById('species-detail');
    if (!elSpGrid || !elSpDetail) return;
    elSpGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    const totalSlots = 6;
    const items = state.sp.slice(0, totalSlots);
    for (let i = 0; i < totalSlots; i++){
      const sp = items[i];
      const card = document.createElement('div');
      if (sp){
        const selCls = (i === state.selected ? ' selected' : '');
        card.className = `sp-card ${colorClass(i)}${selCls}`;
        card.setAttribute('data-index', String(i));
        card.innerHTML = `<div class="sp-name">${sp.name}</div><div class="sp-total">tot ${fmt(Math.round(sp.pop),0)}</div>`;
      } else {
        card.className = 'sp-card empty';
        card.innerHTML = `<div class=\"sp-name\">—</div><div class=\"sp-total\">&nbsp;</div>`;
      }
      frag.appendChild(card);
    }
    elSpGrid.appendChild(frag);
    renderSpeciesDetail(state.selected ?? 0);
  }

  function renderSpeciesDetail(idx){
    const s = state.sp[idx] || state.sp[0];
    if (!s) return;
    if (elSpInfo){
      const eats = s.eats || '—';
      const lines = [];
      lines.push(`Name: ${s.name}`);
      lines.push(`Pop:  ${fmt(Math.round(s.pop),0)}`);
      lines.push(`Eats: ${eats}`);
      lines.push(`MaxA: ${s.maxAge ?? '—'}`);
      lines.push('');
      lines.push(`last+: ${fmt(s.last_g,2)} / step`);
      lines.push(`last-: ${fmt(s.last_d,2)} / step`);
      lines.push(`gRate: ${fmt(s.last_gr,3)}  dRate: ${fmt(s.last_dr,3)}`);
      elSpInfo.textContent = lines.join('\n');
    }
  }

  // Input bar actions
  function addToSelected(n){
    const idx = state.selected ?? 0;
    const s = state.sp[idx];
    if (!s) return;
    s.pop = Math.max(0, s.pop + n);
    renderSpeciesDetail(idx);
    // refresh card counts text without rebuilding whole grid
    const card = elSpGrid?.querySelector(`.sp-card[data-index="${idx}"] .sp-total`);
    if (card) card.textContent = `tot ${fmt(Math.round(s.pop),0)}`;
  }
  btnAdd1?.addEventListener('click', ()=> addToSelected(1));
  btnAdd10?.addEventListener('click', ()=> addToSelected(10));
  btnAdd100?.addEventListener('click', ()=> addToSelected(100));

  function renderLog(){
    elLog.innerHTML = state.log.map(s => `<span class="fg-dim">${s}</span>`).join('\n');
  }

  function measureCols(target, fallback){
    // Estimate number of monospace columns that fit in the viz container
    const el = target;
    if (!el) return fallback;
    const cw = 8; // conservative char width estimate; could be measured if needed
    const pad = 16; // padding and borders
    const w = Math.max(0, el.clientWidth - pad);
    const cols = Math.max(20, Math.floor(w / cw));
    return cols || fallback;
  }

  function renderMix(){
    const rightW = measureCols(elViz, 56);
    const gridH = 16;
    const totalPop = Math.max(1e-6, state.sp.reduce((a,b)=>a+b.pop,0));
    function bar(){
      const counts = state.sp.map(s => Math.floor((s.pop/totalPop)*(rightW)));
      while (counts.reduce((a,b)=>a+b,0) < rightW){
        const rema = state.sp.map(s => (s.pop/totalPop)*rightW);
        let idx = 0, best = -1; for (let i=0;i<counts.length;i++){ const rem = rema[i] - counts[i]; if (rem>best){ best=rem; idx=i; } }
        counts[idx]++;
      }
      let row = '';
      for (let i=0;i<counts.length;i++) row += state.sp[i].sym.repeat(counts[i]);
      return row;
    }
    const b = bar();
    const lines = [ `<span class="fg-dim">[ Ecosystem Mix ]</span>` ];
    for (let r=0;r<gridH;r++){
      let colored = '';
      for (let i=0;i<b.length;i++){
        const ch = b[i];
        const cls = ch==='.'? 'fg-grass' : ch==='r'? 'fg-hop' : ch==='i'? 'fg-insect' : ch==='f'? 'fg-frog' : ch==='b'? 'fg-bird' : 'fg-eagle';
        colored += `<span class="${cls}">${ch}</span>`;
      }
      lines.push(colored);
    }
    elViz.innerHTML = lines.join('\n');
  }

  // ASCII stacked graph of species populations over time
  function renderGraph(){
    const width = measureCols(elViz, 70);  // columns
    const height = 16; // rows
    const hist = state.hist;
    const lines = [];
    lines.push(`<span class="fg-dim">[ Population (stacked) ]</span>`);
    if (hist.length < 2){
      lines.push('<span class="fg-dim">Collecting data…</span>');
      elViz.innerHTML = lines.join('\n');
      return;
    }
    // Sample last N columns
    const cols = Math.min(width, hist.length);
    const start = hist.length - cols;
    const slice = hist.slice(start);
    // Compute per-column totals and scale
    const totals = slice.map(col => col.reduce((a,b)=>a+b,0));
    const maxTotal = Math.max(1e-6, ...totals);
    // For each column, compute stacked heights for all species
    // height excludes title row; draw height rows of graph using characters per species
    // We'll use symbols and color by species
    const chars = ['.','r','i','f','b','e'];
    const clsFor = (i)=> i===0? 'fg-grass' : i===1? 'fg-hop' : i===2? 'fg-insect' : i===3? 'fg-frog' : i===4? 'fg-bird' : 'fg-eagle';

    // Create grid filled with spaces
    const grid = Array.from({length: height}, ()=>Array(cols).fill(' '));
    const gridCls = Array.from({length: height}, ()=>Array(cols).fill(''));

    for (let c=0;c<cols;c++){
      const values = slice[c]; // [g, h, f, s, e]
      const total = Math.max(1e-6, totals[c]);
      // target total height for this column
      const target = Math.max(1, Math.round((total / maxTotal) * height));
      // proportional heights, then adjust to fit exactly target
      let heights = values.map(v => Math.floor((v/total)*target));
      let sum = heights.reduce((a,b)=>a+b,0);
      while (sum < target){
        // give extra row to species with largest remainder
        const rema = values.map((v,i)=> (v/total)*target - heights[i]);
        let idx=0, best=-1; for (let i=0;i<rema.length;i++){ if (rema[i]>best){best=rema[i]; idx=i;} }
        heights[idx]++; sum++;
      }
      // fill from bottom up
      let row = height-1;
      for (let i=0;i<heights.length;i++){
        for (let k=0;k<heights[i] && row>=0;k++, row--){
          grid[row][c] = chars[i];
          gridCls[row][c] = clsFor(i);
        }
      }
    }

    // Build lines with color spans
    for (let r=0;r<height;r++){
      let line = '';
      for (let c=0;c<cols;c++){
        const ch = grid[r][c];
        const cls = gridCls[r][c];
        if (cls){ line += `<span class="${cls}">${ch}</span>`; }
        else { line += ' '; }
      }
      lines.push(line);
    }

    // Legend
    lines.push(`<span class="fg-dim">Legend:</span> <span class="fg-grass">.</span> Plants  <span class="fg-hop">r</span> Rabbits  <span class="fg-insect">i</span> Insects  <span class="fg-frog">f</span> Foxes  <span class="fg-bird">b</span> Birds  <span class="fg-eagle">e</span> Eagles`);
    elViz.innerHTML = lines.join('\n');
  }

  function renderAll(){
    renderStats();
    renderSpecies();
    renderLog();
    if (activeTab === 'mix') renderMix(); else renderGraph();
  }

  tabMix?.addEventListener('click', ()=>{ activeTab = 'mix'; tabMix.classList.add('active'); tabGraph.classList.remove('active'); renderAll(); });
  tabGraph?.addEventListener('click', ()=>{ activeTab = 'graph'; tabGraph.classList.add('active'); tabMix.classList.remove('active'); renderAll(); });

  window.PopSimUI = { renderAll };
})();

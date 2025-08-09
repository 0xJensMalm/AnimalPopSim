// UI rendering into #stats, #species, #log, #mix
(function(){
  const { state, P, fmt } = window.PopSim;
  const elStats = document.getElementById('stats');
  const elSpecies = document.getElementById('species');
  const elSpPanel = document.getElementById('species-panel');
  const elSpGrid = document.getElementById('species-grid');
  const elSpDetail = document.getElementById('species-detail');
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
    // Build grid of species cards (3x2)
    if (!elSpGrid || !elSpDetail) {
      // Fallback to old list if grid not available
      if (elSpecies){ elSpecies.textContent = state.sp.map(s=>`${s.name} ${fmt(s.pop,1)}`).join('\n'); }
      return;
    }
    elSpGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    // Ensure exactly 6 entries (pad with empty placeholders; cap at 6)
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
        card.innerHTML = `<div class="sp-name">—</div><div class="sp-total">&nbsp;</div>`;
      }
      frag.appendChild(card);
    }
    elSpGrid.appendChild(frag);
    // Detail for selected species
    renderSpeciesDetail(state.selected ?? 0);
    // Click handling via delegation
    if (!elSpGrid.dataset.clickbound){
      elSpGrid.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const t = ev.target.closest('.sp-card');
        if (!t || t.classList.contains('empty')) return;
        const idx = +t.getAttribute('data-index');
        if (Number.isNaN(idx)) return;
        state.selected = idx;
        elSpGrid.dataset.selected = String(idx);
        // toggle selected class
        elSpGrid.querySelectorAll('.sp-card').forEach(card => card.classList.remove('selected'));
        t.classList.add('selected');
        // update detail only
        renderSpeciesDetail(idx);
        // log selection
        const s = state.sp[idx];
        const eats = s.eats || '—';
        const msg = `${s.name}: eats ${eats} | eat ${fmt(s.last_g,2)}/step | breed ${fmt(s.growth,2)} | death ${fmt(s.death,2)} | maxAge ${s.maxAge ?? '—'} | pop ${fmt(s.pop,1)} | gRate ${fmt(s.last_gr,3)} | dRate ${fmt(s.last_dr,3)}`;
        state.log.push(msg);
        if (state.log.length > 200) state.log.shift();
        renderLog();
        elLog.scrollTop = elLog.scrollHeight;
      });
      elSpGrid.dataset.clickbound = '1';
    }
  }

  function renderSpeciesDetail(idx){
    const s = state.sp[idx] || state.sp[0];
    if (!s || !elSpDetail) return;
    const eats = s.eats || '—';
    const nameLine = `<span class="${colorClass(idx)}">Name: ${s.name}</span>`;
    const col1 = [
      nameLine,
      `total pop: ${fmt(Math.round(s.pop),0)}`,
      `eats: ${eats}`,
      `max age: ${s.maxAge ?? '—'}`,
    ].join('\n');
    const col2 = [
      `breed rate: ${fmt(s.last_g,2)} / step`,
      `death rate: ${fmt(s.last_d,2)} / step`,
      `(breed depends on energy: prey/sun)`,
      `(death depends on predators/old age)`,
    ].join('\n');
    elSpDetail.innerHTML = `
      <div class="col"><h4>Info</h4><pre class="sp-pre">${col1}</pre></div>
      <div class="col"><h4>Rates</h4><pre class="sp-pre">${col2}</pre></div>
    `;
  }

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
    // For each column, compute stacked heights for 5 species
    // height excludes title row; draw height rows of graph using characters per species
    // We'll use symbols and color by species
    const chars = ['.','r','f','w','b'];
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

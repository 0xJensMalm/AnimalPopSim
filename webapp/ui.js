// UI rendering into #stats, #species, #log, #mix
(function(){
  const { state, P, fmt } = window.PopSim;
  const elStats = document.getElementById('stats');
  const elSpecies = document.getElementById('species');
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

  function colorClass(i){ return i===0? 'fg-grass' : i===1? 'fg-hop' : i===2? 'fg-frog' : i===3? 'fg-snake' : 'fg-eagle'; }

  function renderSpecies(){
    const lines = [];
    lines.push(`<span class="fg-dim">${headerRow()}</span>`);
    for (let i=0;i<state.sp.length;i++){
      const sp = state.sp[i];
      const sel = (i === state.selected) ? '->' : '  ';
      const row = `${sel} ${padRight(sp.name,14)} ${padLeft(fmt(sp.pop,1),7)} ${padLeft(fmt(sp.last_gr,3),8)} ${padLeft(fmt(sp.last_dr,3),8)} ${padLeft(fmt(sp.last_g,2),8)} ${padLeft(fmt(sp.last_d,2),8)}`;
      lines.push(`<span class="${colorClass(i)}">${row}</span>`);
    }
    elSpecies.innerHTML = lines.join('\n');
  }

  function renderLog(){
    elLog.innerHTML = state.log.map(s => `<span class="fg-dim">${s}</span>`).join('\n');
  }

  function renderMix(){
    const rightW = 56;
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
        const cls = ch==='.'? 'fg-grass' : ch==='h'? 'fg-hop' : ch==='f'? 'fg-frog' : ch==='s'? 'fg-snake' : 'fg-eagle';
        colored += `<span class="${cls}">${ch}</span>`;
      }
      lines.push(colored);
    }
    elViz.innerHTML = lines.join('\n');
  }

  // ASCII stacked graph of species populations over time
  function renderGraph(){
    const width = 70;  // columns
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
    const chars = ['.','h','f','s','e'];
    const clsFor = (i)=> i===0? 'fg-grass' : i===1? 'fg-hop' : i===2? 'fg-frog' : i===3? 'fg-snake' : 'fg-eagle';

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
    lines.push(`<span class="fg-dim">Legend:</span> <span class="fg-grass">.</span> Grass  <span class="fg-hop">h</span> Hop  <span class="fg-frog">f</span> Frog  <span class="fg-snake">s</span> Snake  <span class="fg-eagle">e</span> Eagle`);
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

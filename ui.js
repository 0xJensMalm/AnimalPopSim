/* global Sim, Species, Storage */
(function () {
    /* ---------- DOM shortcut refs ---------- */
    const monitor  = document.getElementById('monitor');
    const insights = document.getElementById('insights');
    const menu     = document.getElementById('menu');
    const tooltip  = document.getElementById('tooltip');
    
    /* ---------- Population history tracking ---------- */
    const historyLength = 30; // Store the last 30 data points
    const popHistory = {}; // Store population history for each species
    let totalHistory = []; // Store total population history
  
    /* ---------- build control panel ---------- */
    const sel = Object.assign(document.createElement('select'),{id:'speciesSelect'});
    for (const id in Species.catalogue){
      sel.appendChild(Object.assign(document.createElement('option'),{value:id,textContent:id}));
    }
    const makeBtn = txt => Object.assign(document.createElement('button'),
                                         {type:'button',textContent:txt});
    const add   = makeBtn('Add');   const start = makeBtn('Start');
    const stop  = makeBtn('Stop');  const ff    = makeBtn('⏩ x4');
    const save  = makeBtn('Save');
    menu.append(sel,add,document.createElement('hr'),start,stop,ff,save);
  
    /* ---------- button hooks ---------- */
    add.onclick   = () => Sim.add(sel.value,1);
    start.onclick = () => Sim.start();
    stop.onclick  = () => Sim.stop();
    ff.onclick    = () => Sim.fastForward(20);
    save.onclick  = () => Storage.save();
  
    /* ---------- logging & render ---------- */
    const log=[];
  
    function logTick (d){
      // Update population history
      let totalPop = 0;
      for (const s of Sim.list) {
        const id = s.id;
        const pop = Sim.pop[id].length;
        totalPop += pop;
        
        // Initialize history array for this species if needed
        if (!popHistory[id]) popHistory[id] = [];
        
        // Add current population and limit history length
        popHistory[id].push(pop);
        if (popHistory[id].length > historyLength) popHistory[id].shift();
      }
      
      // Update total population history
      totalHistory.push(totalPop);
      if (totalHistory.length > historyLength) totalHistory.shift();
      
      // Generate console log
      const parts = Sim.list.map(s=>{
        const diff=d[s.id].births-d[s.id].deaths, sign=diff>=0?'+':'';
        return `<span class="sp" data-id="${s.id}" style="color:${s.color}">${s.emoji}${Sim.pop[s.id].length}</span><span style="color:#888">Δ${sign}${diff}</span>`;
      });
      log.push(`${String(Sim.time).padStart(4)}│ ${parts.join(' | ')}`);
      if (log.length>300) log.shift();
      // Auto-scroll monitor to bottom
      setTimeout(() => monitor.scrollTop = monitor.scrollHeight, 0);
    }
  
    function render (){
      /* monitor */
      monitor.innerHTML = log.join('\n');
  
      /* insights */
      let html='<div class="insights-title">Population Insights</div>';
      let totalPopulation = 0;
      
      // Add environment status display
      const sunlightPercent = Math.round(Sim.environment.sunlight * 100);
      const sunlightIcon = sunlightPercent > 100 ? '☀️' : (sunlightPercent < 90 ? '⛅' : '🌤️');
      
      html += `<div class="environment-status">
                <div>${sunlightIcon} Sunlight: <span style="color:#ffcc00">${sunlightPercent}%</span></div>
                <div>Cycle: ${Sim.environment.weatherCycle}/100</div>
              </div>`;
      
      // Organize species by ecological role
      const producers = [];
      const herbivores = [];
      const omnivores = [];
      const predators = [];
      
      // Categorize species
      for (const spec of Sim.list) {
        if (spec.photosynthesis) {
          producers.push(spec);
        } else if (spec.eats.includes('plant') && spec.eats.length === 1) {
          herbivores.push(spec);
        } else if (spec.eats.some(prey => !prey.includes('plant'))) {
          if (spec.eats.includes('plant')) {
            omnivores.push(spec);
          } else {
            predators.push(spec);
          }
        }
      }
      
      // Function to create species row
      const createSpeciesRow = (spec) => {
        const arr = Sim.pop[spec.id];
        totalPopulation += arr.length;
        const avg = arr.length ? (arr.reduce((a,b)=>a+b.energy,0)/arr.length).toFixed(1) : '0';
        const energyStatus = getEnergyStatus(avg, spec);
        
        return `<div class="row sp" data-id="${spec.id}">
                 <div><span style="color:${spec.color}">${spec.emoji}</span> ${spec.id}</div>
                 <div>Pop: <strong>${arr.length}</strong> | Energy: <span style="color:${energyStatus.color}">${avg}</span></div>
               </div>`;
      };
      
      // Producers section
      if (producers.length > 0) {
        html += `<div class="ecosystem-category producers">Producers</div>`;
        producers.forEach(spec => html += createSpeciesRow(spec));
      }
      
      // Herbivores section
      if (herbivores.length > 0) {
        html += `<div class="ecosystem-category herbivores">Herbivores</div>`;
        herbivores.forEach(spec => html += createSpeciesRow(spec));
      }
      
      // Omnivores section
      if (omnivores.length > 0) {
        html += `<div class="ecosystem-category omnivores">Omnivores</div>`;
        omnivores.forEach(spec => html += createSpeciesRow(spec));
      }
      
      // Predators section
      if (predators.length > 0) {
        html += `<div class="ecosystem-category predators">Predators</div>`;
        predators.forEach(spec => html += createSpeciesRow(spec));
      }
      
      // Create combined population graph with line overlays
      if (Sim.time > 0) {
        html += `<div class="graph-title">Population Trends</div>`;
        html += createCombinedGraph();
      }
      
      // Add total population stats
      html+=`<div class="total-population">
               <div>Total Population: <strong>${totalPopulation}</strong></div>
               <div>Simulation Time: ${Sim.time}</div>
             </div>`;
             
      insights.innerHTML = html;
    }
    
    // Function to create a combined population graph with overlaid lines
    function createCombinedGraph() {
      // Only include species with history data
      const speciesWithData = Sim.list.filter(spec => 
        popHistory[spec.id] && popHistory[spec.id].length > 1
      );
      
      // If no data yet, return empty
      if (speciesWithData.length === 0 && totalHistory.length <= 1) {
        return '<div class="population-graph">Not enough data yet...</div>';
      }
      
      // Find the max value across all species for proper scaling
      let maxValue = Math.max(
        ...totalHistory,
        ...speciesWithData.flatMap(spec => popHistory[spec.id])
      );
      
      // Round up to a nice number for y-axis
      maxValue = Math.ceil(maxValue / 10) * 10;
      if (maxValue < 10) maxValue = 10;
      
      // Create graph container
      let html = '<div class="population-graph">';
      
      // Graph title
      html += '<div class="graph-container">';
      
      // Y-axis labels
      html += '<div class="graph-y-axis">';
      for (let i = 4; i >= 0; i--) {
        const value = Math.round(maxValue * i / 4);
        html += `<span>${value}</span>`;
      }
      html += '</div>';
      
      // Create lines for each species
      speciesWithData.forEach(spec => {
        const data = popHistory[spec.id];
        const points = data.slice(-20); // Last 20 data points
        
        html += `<div class="graph-line">`;
        points.forEach((value, index) => {
          const height = (value / maxValue * 100);
          
          html += `<div class="graph-point">`;
          html += `<div class="graph-point-line" style="
            height: ${height}%; 
            background-color: ${spec.color};
            width: 2px;
            box-shadow: 0 0 3px ${spec.color};
          "></div>`;
          html += `</div>`;
        });
        html += `</div>`;
      });
      
      // Create total population line (overlay on top of others)
      if (totalHistory.length > 1) {
        const totalPoints = totalHistory.slice(-20); // Last 20 data points
        
        html += `<div class="graph-line" style="z-index:10;position:relative">`;
        totalPoints.forEach((value, index) => {
          const height = (value / maxValue * 100);
          
          html += `<div class="graph-point">`;
          html += `<div class="graph-point-line" style="
            height: ${height}%; 
            background-color: #00ffff;
            width: 3px;
            box-shadow: 0 0 4px #00ffff;
            z-index: 10;
          "></div>`;
          html += `</div>`;
        });
        html += `</div>`;
      }
      
      html += '</div>'; // Close graph-container
      
      // X-axis time markers
      html += '<div class="graph-x-axis">';
      html += '<span>Past</span>';
      html += '<span>Now</span>';
      html += '</div>';
      
      // Legend for all species
      html += '<div class="graph-legend">';
      
      // Add total population to legend
      if (totalHistory.length > 1) {
        html += `<div class="graph-legend-item">
                  <div class="legend-color" style="background:#00ffff"></div>
                  <span>Total: ${totalHistory[totalHistory.length-1]}</span>
                </div>`;
      }
      
      // Add legend entries for each species
      speciesWithData.forEach(spec => {
        const population = popHistory[spec.id][popHistory[spec.id].length - 1];
        html += `<div class="graph-legend-item">
                  <div class="legend-color" style="background:${spec.color}"></div>
                  <span>${spec.emoji} ${spec.id}: ${population}</span>
                </div>`;
      });
      
      html += '</div>'; // Close legend
      html += '</div>'; // Close population-graph
      
      return html;
    }
    
    // Helper function to determine energy status color
    function getEnergyStatus(energyAvg, spec) {
      const energy = parseFloat(energyAvg);
      if (energy <= spec.starveAt + 1) {
        return { status: 'Critical', color: '#ff0000' };
      } else if (energy <= spec.hungryAt + 1) {
        return { status: 'Low', color: '#ff9900' };
      } else if (energy >= spec.maxEnergy * 0.8) {
        return { status: 'Excellent', color: '#00cc00' };
      } else {
        return { status: 'Good', color: '#33cc33' };
      }
    }
  
    /* ---------- tooltip (hover / tap) ---------- */
    let show=false;
    function tipShow (id,x,y){
      const spec=Species.catalogue[id];
      tooltip.textContent=(spec&&spec.facts)||'No facts yet.';
      tooltip.style.left=(x+12)+'px'; tooltip.style.top=(y+12)+'px';
      tooltip.hidden=false; show=true;
    }
    function tipHide (){ if(show){tooltip.hidden=true;show=false;} }
  
    document.addEventListener('mouseover',e=>{
      const el=e.target.closest('.sp');
      if(el) tipShow(el.dataset.id,e.clientX,e.clientY); else tipHide();
    });
    document.addEventListener('mousemove',e=>{
      if(show){tooltip.style.left=(e.clientX+12)+'px';
               tooltip.style.top=(e.clientY+12)+'px';}
    });
    document.addEventListener('mouseout',e=>{
      if(!e.relatedTarget||!e.relatedTarget.closest('.sp')) tipHide();
    });
    document.addEventListener('click',e=>{
      const el=e.target.closest('.sp');
      if(el){ if(show) tipHide(); else tipShow(el.dataset.id,e.clientX,e.clientY);}
      else tipHide();
    });
  
    /* ---------- expose to other modules ---------- */
    window.UI = { render, logTick };
  
    /* ---------- boot ---------- */
    Sim.init();
  })();
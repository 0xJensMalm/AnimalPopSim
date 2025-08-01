/* global Species, Storage, UI */
(function () {
    function pick (arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  
    const Sim = {
      time:0, list:[], pop:{}, timer:null, speed:500,
      // Environmental factors
      environment: {
        sunlight: 1.0,  // Sunlight intensity factor (affects plant energy gain)
        weatherCycle: 0 // For potential weather cycles
      },
  
      init () {
        if (!Storage.load()) {
          // build empty arrays + seed a balanced ecosystem
          for (const id in Species.catalogue){
            this.list.push(Species.catalogue[id]);
            this.pop[id] = [];
          }
          // Balanced starting populations
          this.add('plant', 80); // Primary producers - need plenty to support ecosystem
          this.add('bug', 30);   // Small insects - fast breeding
          this.add('mouse', 20); // Small herbivores
          this.add('rabbit', 15); // Larger herbivores
          this.add('hedgehog', 8); // Omnivores
          this.add('owl', 4);    // Specialized predator
          this.add('fox', 3);    // Top predator
        }
        UI.render();
      },
  
      add (id,n=1){
        const spec = Species.catalogue[id]; if (!spec) return;
        while (n--) this.pop[id].push(Species.newIndividual(spec));
        UI.render();
      },
  
      start (){
        if (!this.timer) this.timer = setInterval(()=>this.tick(),this.speed);
      },
      stop (){
        clearInterval(this.timer); this.timer=null;
      },
      fastForward (loops=20){ while (loops--) this.tick(); },
  
      tick (){
        this.time++;
        const delta = {};                // births & deaths per species
        
        // Update environmental factors if needed
        this.updateEnvironment();
  
        for (const spec of this.list){
          const arr = this.pop[spec.id];
          let births=0, deaths=0;
  
          for (let i=arr.length-1;i>=0;i--){
            const a = arr[i];
            a.age++; 
            
            // Energy consumption (plants consume less energy)
            if (spec.photosynthesis) {
              // Plants gain energy from sunlight instead of losing it
              a.energy = Math.min(
                a.energy + (spec.photoRate * this.environment.sunlight),
                spec.maxEnergy
              );
            } else {
              // Animals lose energy over time
              a.energy--;
            }
  
            // Death checks
            if (a.energy <= spec.starveAt) { 
              arr.splice(i,1); 
              deaths++; 
              continue; 
            }
            
            if (Math.random() < spec.deathRate || a.age > spec.maxAge) {
              arr.splice(i,1); 
              deaths++; 
              continue;
            }
  
            // Feeding behavior
            if (spec.eats.length && Math.random() < spec.eatRate) {
              // Select random prey type
              const preyId = pick(spec.eats);
              const preyArr = this.pop[preyId];
              
              // Only hunt if prey exists
              if (preyArr && preyArr.length > 0) {
                // Remove a random prey (not just the last one)
                const preyIndex = Math.floor(Math.random() * preyArr.length);
                preyArr.splice(preyIndex, 1);
                
                // Gain energy from eating
                a.energy = Math.min(a.energy + spec.eatGain, spec.maxEnergy);
              }
            }
  
            // Breeding logic - different for plants vs animals
            if (spec.photosynthesis) {
              // Plants can reproduce regardless of energy if sunlight is sufficient
              if (Math.random() < spec.breedRate * this.environment.sunlight) {
                // Population density check - less breeding in crowded conditions
                const populationFactor = Math.max(0.1, 1 - (arr.length / 300));
                
                if (Math.random() < populationFactor) {
                  arr.push(Species.newIndividual(spec)); 
                  births++;
                  // Plants lose minimal energy when reproducing
                  a.energy = Math.max(a.energy - 0.5, 0);
                }
              }
            } else {
              // Animals require sufficient energy to breed
              if (a.energy > spec.hungryAt && Math.random() < spec.breedRate) {
                // Population density check - less breeding in crowded conditions
                const populationFactor = Math.max(0.1, 1 - (arr.length / 150));
                
                if (Math.random() < populationFactor) {
                  arr.push(Species.newIndividual(spec)); 
                  births++;
                  
                  // Parents lose some energy when breeding
                  a.energy = Math.max(a.energy - 3, spec.hungryAt);
                }
              }
            }
          }
          
          delta[spec.id] = { births, deaths };
        }
  
        UI.logTick(delta);
        UI.render();
      },
      
      // Update environmental factors (seasons, weather, etc.)
      updateEnvironment() {
        // Simple cyclic variations in sunlight (can simulate seasons)
        const cyclePeriod = 100; // Length of full cycle
        const cyclePosition = this.time % cyclePeriod;
        const cycleValue = Math.sin((cyclePosition / cyclePeriod) * Math.PI * 2);
        
        // Sunlight varies between 0.7 and 1.3 (30% variation)
        this.environment.sunlight = 1.0 + (cycleValue * 0.3);
        this.environment.weatherCycle = cyclePosition;
      }
    };
  
    window.Sim = Sim;
  })();
import { Species } from './species.js';
import { Storage } from './storage.js';
import { UI } from './ui.js';
import { Insights } from './insights.js';

// Helper function for random selection from arrays
const randomPick = arr => arr[Math.floor(Math.random() * arr.length)];

export const Sim = {
  // Core simulation state
  time: 0,
  isRunning: false,
  timer: null,
  tickSpeed: 500, // milliseconds between ticks
  
  // Population data
  species: [], // List of species definitions
  populations: {}, // Current individuals by species
  history: {
    total: { pop: [], biomass: [] },
    producers: { pop: [], growth: [], biomass: [], deaths: [] },
    consumers: { pop: [], health: [], births: [], deaths: [] },
    speciesData: {} // Historical data per species
  },
  
  // Environmental factors
  environment: {
    sunlight: 1.0, // Factor affecting plant growth
    season: 'summer', // Visual indicator only
    cycleDay: 0 // Position in seasonal cycle
  },
  
  // Initialize the simulation
  init() {
    // Load any saved data or start fresh
    const savedData = Storage.load();
    
    if (savedData) {
      this.time = savedData.time;
      this.populations = savedData.populations;
      this.history = savedData.history;
      this.environment = savedData.environment;
    } else {
      // Start with empty populations
      this.species = Species.getAll();
      this.resetPopulations();
      
      // Add initial populations based on species.startPop property
      this.species.forEach(species => {
        if (species.startPop && species.startPop > 0) {
          this.addIndividuals(species.id, species.startPop);
        }
      });
    }
    
    // Initialize history if empty
    if (!this.history.speciesData) {
      this.history.speciesData = {};
      this.species.forEach(s => {
        this.history.speciesData[s.id] = { 
          pop: [], energy: [], births: [], deaths: [] 
        };
      });
    }
    
    // Update UI with initial state
    this.updateStats();
  },
  
  // Reset populations (used when starting fresh)
  resetPopulations() {
    this.populations = {};
    this.species.forEach(s => {
      this.populations[s.id] = [];
      
      // Initialize history tracking for this species
      if (!this.history.speciesData[s.id]) {
        this.history.speciesData[s.id] = {
          pop: [], energy: [], births: [], deaths: []
        };
      }
    });
  },
  
  // Initialize species and their starting populations
  initializeSpecies() {
    // Make sure we have the latest species definitions
    this.species = Species.getAll();
    
    // Add initial populations based on species.startPop property
    this.species.forEach(species => {
      if (species.startPop && species.startPop > 0) {
        this.addIndividuals(species.id, species.startPop);
      }
    });
    
    // Initialize history tracking for all species
    this.species.forEach(s => {
      if (!this.history.speciesData[s.id]) {
        this.history.speciesData[s.id] = { 
          pop: [], energy: [], births: [], deaths: [] 
        };
      }
    });
  },
  
  // Complete reset of the simulation
  reset() {
    // Stop the simulation if it's running
    if (this.isRunning) {
      this.stop();
    }
    
    // Reset time and environmental factors
    this.time = 0;
    this.environment = {
      sunlight: 1.0,
      season: 'summer',
      cycleDay: 0
    };
    
    // Reset all population data
    this.resetPopulations();
    
    // Reset history data
    this.history = {
      total: { pop: [], biomass: [] },
      producers: { pop: [], growth: [], biomass: [], deaths: [] },
      consumers: { pop: [], health: [], births: [], deaths: [] },
      speciesData: {}
    };
    
    // Re-initialize species and their starting populations
    this.initializeSpecies();
    
    // Update UI
    UI.updateStats();
    if (Insights.update) {
      Insights.update();
    }
    
    // Log the reset
    UI.log('⟲ Simulation has been reset to initial state');
  },
  
  // Add individuals of a species
  addIndividuals(speciesId, count = 1) {
    const spec = Species.get(speciesId);
    if (!spec || !this.populations[speciesId]) return;
    
    for (let i = 0; i < count; i++) {
      this.populations[speciesId].push({
        id: crypto.randomUUID().slice(0, 8),
        age: 0,
        energy: spec.maxEnergy * 0.7 + (Math.random() * spec.maxEnergy * 0.3)
      });
    }
    
    this.updateStats();
    UI.log(`Added ${count} ${spec.name} to the ecosystem`);
  },
  
  // Start the simulation
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.timer = setInterval(() => this.tick(), this.tickSpeed);
    UI.log('► Simulation started');
  },
  
  // Stop the simulation
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.timer);
    this.timer = null;
    UI.log('⏹ Simulation stopped');
    
    // Save the current state
    Storage.save({
      time: this.time,
      populations: this.populations,
      history: this.history,
      environment: this.environment
    });
  },
  
  // Set simulation speed (1-10)
  setSpeed(value) {
    const speed = parseInt(value);
    if (isNaN(speed) || speed < 1 || speed > 10) return;
    
    // Convert speed setting to milliseconds (faster = smaller number)
    this.tickSpeed = 1000 - ((speed - 1) * 100); // 1000ms to 100ms
    
    // If running, restart with new speed
    if (this.isRunning) {
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), this.tickSpeed);
    }
  },
  
  // Process one simulation tick
  tick() {
    this.time++;
    
    // Update environment
    this.updateEnvironment();
    
    // Track interesting events
    const tickData = {};
    
    // Migration chance calculation - allow extinct species to return
    this.checkMigration();
    
    // Process each species
    this.species.forEach(spec => {
      const population = this.populations[spec.id];
      
      // Skip if no individuals
      if (population.length === 0) {
        // Track empty populations in data
        tickData[spec.id] = { pop: 0, energy: 0, births: 0, deaths: 0 };
        return;
      }
      
      let births = 0;
      let deaths = 0;
      
      // Process each individual in reverse to safely remove
      for (let i = population.length - 1; i >= 0; i--) {
        const individual = population[i];
        individual.age++;
        
        // Energy changes
        if (spec.producer) {
          // Producers (plants) gain energy from sunlight
          individual.energy = Math.min(
            individual.energy + (spec.photoRate * this.environment.sunlight),
            spec.maxEnergy
          );
        } else {
          // Consumers lose energy over time
          individual.energy -= spec.metabolism;
        }
        
        // Death checks
        if (individual.energy <= 0 || individual.age > spec.maxAge || Math.random() < spec.deathRate) {
          population.splice(i, 1);
          deaths++;
          continue;
        }
        
        // Feeding behavior for consumers
        if (!spec.producer && spec.diet.length > 0 && Math.random() < spec.eatRate) {
          const targetSpecies = randomPick(spec.diet);
          const preyPopulation = this.populations[targetSpecies];
          
          if (preyPopulation && preyPopulation.length > 0) {
            // Find a random prey
            const preyIndex = Math.floor(Math.random() * preyPopulation.length);
            
            // Remove the prey
            preyPopulation.splice(preyIndex, 1);
            
            // Gain energy
            individual.energy = Math.min(individual.energy + spec.eatGain, spec.maxEnergy);
          }
        }
        
        // Reproduction
        if (spec.producer) {
          // Plants reproduce based on sunlight and space
          if (Math.random() < spec.breedRate * this.environment.sunlight) {
            const populationFactor = Math.max(0.1, 1 - (population.length / 200));
            
            if (Math.random() < populationFactor) {
              population.push({
                id: crypto.randomUUID().slice(0, 8),
                age: 0,
                energy: spec.maxEnergy * 0.5
              });
              births++;
            }
          }
        } else {
          // Animals need sufficient energy to reproduce
          if (individual.energy > spec.breedThreshold && Math.random() < spec.breedRate) {
            const populationFactor = Math.max(0.1, 1 - (population.length / 100));
            
            if (Math.random() < populationFactor) {
              population.push({
                id: crypto.randomUUID().slice(0, 8),
                age: 0,
                energy: spec.maxEnergy * 0.6
              });
              births++;
              
              // Reproduction costs energy
              individual.energy *= 0.7;
            }
          }
        }
      }
      
      // Calculate metrics for this species this tick
      const currentPop = population.length;
      const avgEnergy = currentPop > 0 ? 
        population.reduce((sum, ind) => sum + ind.energy, 0) / currentPop : 0;
      
      tickData[spec.id] = { 
        pop: currentPop, 
        births, 
        deaths, 
        avgEnergy: avgEnergy,
        healthPct: currentPop > 0 ? (avgEnergy / spec.maxEnergy) * 100 : 0
      };
      
      // Update history for this species
      this.history.speciesData[spec.id].pop.push(currentPop);
      this.history.speciesData[spec.id].energy.push(avgEnergy);
      this.history.speciesData[spec.id].births.push(births);
      this.history.speciesData[spec.id].deaths.push(deaths);
      
      // Cap history length
      const maxHistory = 100;
      if (this.history.speciesData[spec.id].pop.length > maxHistory) {
        this.history.speciesData[spec.id].pop.shift();
        this.history.speciesData[spec.id].energy.shift();
        this.history.speciesData[spec.id].births.shift();
        this.history.speciesData[spec.id].deaths.shift();
      }
    });
    
    // Log interesting events
    this.logEvents(tickData);
    
    // Update global stats
    this.updateStats();
    
    // Auto-save every 10 ticks
    if (this.time % 10 === 0) {
      Storage.save({
        time: this.time,
        populations: this.populations,
        history: this.history,
        environment: this.environment
      });
    }
  },
  
  // Check for possible migration of extinct species
  checkMigration() {
    // Only check for migration every 10 ticks
    if (this.time % 10 !== 0) return;
    
    this.species.forEach(spec => {
      if (this.populations[spec.id].length === 0) {
        // For extinct species, check if they could migrate in
        let canMigrate = false;
        
        // Migration factors:
        // 1. If it's a producer, it can always migrate
        if (spec.producer) {
          canMigrate = true;
        }
        // 2. For consumers, check if there's enough food
        else {
          // Check if enough prey exists for this consumer
          const foodAvailable = spec.diet.some(foodId => {
            const preyCount = this.populations[foodId]?.length || 0;
            return preyCount > 10; // Need substantial food to migrate in
          });
          
          canMigrate = foodAvailable;
        }
        
        // Apply migration with a low probability if conditions are favorable
        if (canMigrate && Math.random() < 0.1) { // 10% chance when conditions are right
          const migrants = 1 + Math.floor(Math.random() * 2); // 1-2 individuals migrate in
          this.addIndividuals(spec.id, migrants);
          UI.log(`🔄 ${migrants} ${spec.name} migrated into the ecosystem!`, 'system');
        }
      }
    });
  },
  
  // Update environmental factors
  updateEnvironment() {
    const cycleDuration = 100; // Length of full seasonal cycle
    this.environment.cycleDay = this.time % cycleDuration;
    
    // Seasonal sunlight variation (sinusoidal)
    const angle = (this.environment.cycleDay / cycleDuration) * 2 * Math.PI;
    this.environment.sunlight = 1.0 + 0.3 * Math.sin(angle);
    
    // Update season name based on position in cycle
    const seasonPosition = Math.floor((this.environment.cycleDay / cycleDuration) * 4);
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    this.environment.season = seasons[seasonPosition];
  },
  
  // Calculate and update global statistics
  updateStats() {
    // Calculate totals
    let totalPop = 0;
    let producerPop = 0;
    let consumerPop = 0;
    let totalBiomass = 0;
    
    this.species.forEach(spec => {
      const count = this.populations[spec.id].length;
      totalPop += count;
      
      if (spec.producer) {
        producerPop += count;
      } else {
        consumerPop += count;
      }
      
      // Biomass is population * energy
      const totalEnergy = this.populations[spec.id].reduce((sum, ind) => sum + ind.energy, 0);
      totalBiomass += totalEnergy;
    });
    
    // Update global history
    this.history.total.pop.push(totalPop);
    this.history.total.biomass.push(totalBiomass);
    this.history.producers.pop.push(producerPop);
    this.history.consumers.pop.push(consumerPop);
    
    // Cap history length
    const maxHistory = 100;
    if (this.history.total.pop.length > maxHistory) {
      this.history.total.pop.shift();
      this.history.total.biomass.shift();
      this.history.producers.pop.shift();
      this.history.consumers.pop.shift();
    }
    
    // Update UI
    document.getElementById('animal-pop').textContent = consumerPop;
    document.getElementById('bug-pop').textContent = 
      this.populations['insect']?.length + this.populations['grasshopper']?.length || 0;
    document.getElementById('total-biomass').textContent = Math.round(totalBiomass);
    document.getElementById('sim-time').textContent = this.time;
    document.getElementById('sunlight').textContent = `${Math.round(this.environment.sunlight * 100)}%`;
    
    // Update insights panel - only if it's been initialized
    if (Insights.tableElement) {
      Insights.update();
    }
  },
  
  // Log interesting events to the console
  logEvents(tickData) {
    for (const speciesId in tickData) {
      const data = tickData[speciesId];
      const spec = Species.get(speciesId);
      
      // Log significant births or deaths
      if (data.births > 2) {
        UI.log(`${spec.emoji} ${spec.name} breeding: +${data.births} born`);
      }
      
      if (data.deaths > 2) {
        UI.log(`${spec.emoji} ${data.deaths} ${spec.name} have died!`);
      }
      
      // Log extinction events
      if (data.pop === 0 && this.history.speciesData[speciesId].pop.at(-2) > 0) {
        UI.log(`☠️ ${spec.name} population has gone EXTINCT!`, 'warning');
      }
      
      // Log population explosions
      const prevPop = this.history.speciesData[speciesId].pop.at(-2) || 0;
      if (data.pop > prevPop * 1.5 && data.pop > 10) {
        UI.log(`📈 ${spec.emoji} ${spec.name} population is growing rapidly!`);
      }
      
      // Log population crashes
      if (data.pop < prevPop * 0.6 && prevPop > 10) {
        UI.log(`📉 ${spec.emoji} ${spec.name} population is declining rapidly!`);
      }
    }
  }
};

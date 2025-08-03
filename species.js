/**
 * SPECIES CONFIGURATION FILE
 * -------------------------
 * This file contains all species definitions and their properties that affect simulation behavior.
 * Each parameter directly impacts how species interact within the ecosystem.
 *
 * PARAMETER GUIDE:
 * ===============
 * id:             Unique identifier for the species (required)
 * name:           Display name for the species (required)
 * emoji:          Visual representation in UI (required)
 * color:          Color for graphs and UI elements (required)
 * producer:       Boolean - true for plants, false for animals (required)
 * diet:           Array of species IDs this species eats - empty for producers (required)
 * eatRate:        Probability of successful feeding per tick (0-1) - higher means more successful hunting
 * eatGain:        Energy gained per successful feeding - higher means more energy from each meal
 * breedRate:      Probability of breeding per tick when above threshold (0-1) - higher means faster reproduction
 * deathRate:      Probability of natural death per tick (0-1) - higher means shorter lifespan
 * maxAge:         Maximum number of ticks before guaranteed death - higher means longer potential lifespan
 * maxEnergy:      Maximum energy storage capacity - higher means better survival during food shortages
 * metabolism:     Energy lost per tick (0-1) - higher means faster energy depletion
 * breedThreshold: Minimum energy required to reproduce - higher means more selective breeding
 * photoRate:      PLANTS ONLY - Energy gained from sunlight per tick - higher means faster energy production
 * startPop:       Initial population when simulation begins - higher means more abundant at start
 *
 * ECOSYSTEM BALANCE TIPS:
 * ======================
 * - Increase deathRate or metabolism to control overpopulation
 * - Balance predator eatRate/eatGain with prey breedRate to maintain stable populations
 * - Ensure plants have appropriate photoRate to support the herbivore population
 * - Adjust breedThreshold to make reproduction more or less selective
 */

export const Species = {
  /**
   * SPECIES CATALOGUE
   * ================= 
   * Contains all species definitions organized by trophic level:
   * - PRODUCERS: Plants that convert sunlight to energy
   * - PRIMARY CONSUMERS: Herbivores that eat only plants
   * - SECONDARY CONSUMERS: Predators that eat herbivores
   * - TERTIARY CONSUMERS: Apex predators at the top of the food chain
   * 
   * Adjust species parameters here to balance the ecosystem.
   */
  _catalogue: {
    /** 
     * PRODUCERS (plants) - Base of the food chain
     * These convert sunlight directly into energy (biomass).
     * Key balance factors: photoRate, breedRate, maxEnergy
     */
    grass: {
      id: 'grass',      // Unique identifier used in code
      name: 'Grass',    // Display name in UI
      emoji: '🌿',      // Visual representation
      color: '#0f0',    // Color for UI elements and graphs
      producer: true,   // TRUE for plants that photosynthesize
      diet: [],         // Empty for producers (plants don't eat)
      eatRate: 0,       // Unused for producers
      eatGain: 0,       // Unused for producers
      breedRate: 0.20,  // CRITICAL: Reduced from 0.35 to prevent explosive growth (0.20 = 20% chance)
      deathRate: 0.01,  // CRITICAL: Chance of dying per tick - low value means longer lifespan (0.01 = 1% chance)
      maxAge: 400,      // CRITICAL: Maximum lifespan in ticks before guaranteed death
      maxEnergy: 10,    // CRITICAL: Increased energy storage for better stability
      metabolism: 0,    // Plants don't lose energy per tick (0 = no energy loss)
      breedThreshold: 4,// CRITICAL: Slightly higher threshold to slow initial expansion
      photoRate: 0.6,   // CRITICAL: Increased energy gain to balance higher threshold
      startPop: 200,    // Initial population when simulation starts
      description: 'Fast-growing ground cover that thrives in sunlight'
    },
    shrub: {
      id: 'shrub',      // Unique identifier used in code
      name: 'Shrub',    // Display name in UI
      emoji: '🌱',      // Visual representation
      color: '#0c0',    // Color for UI elements and graphs
      producer: true,   // TRUE for plants that photosynthesize
      diet: [],         // Empty for producers (plants don't eat)
      eatRate: 0,       // Unused for producers
      eatGain: 0,       // Unused for producers
      breedRate: 0.15,  // CRITICAL: Medium reproduction rate (0.15 = 15% chance per tick)
      deathRate: 0.008, // CRITICAL: Very low death rate (more resilient than grass)
      maxAge: 800,      // CRITICAL: Long lifespan (double that of grass)
      maxEnergy: 15,    // CRITICAL: Higher energy storage than grass (survives longer without sunlight)
      metabolism: 0,    // Plants don't lose energy per tick
      breedThreshold: 6,// CRITICAL: Higher energy requirement to reproduce than grass (more selective)
      photoRate: 0.6,   // CRITICAL: Higher energy production from sunlight than grass
      startPop: 30,     // Initial population (much lower than grass)
      description: 'Woody plant that provides food and shelter for animals'
    },
    tree: {
      id: 'tree',       // Unique identifier used in code
      name: 'Tree',     // Display name in UI
      emoji: '🌳',      // Visual representation
      color: '#080',    // Color for UI elements and graphs
      producer: true,   // TRUE for plants that photosynthesize
      diet: [],         // Empty for producers (plants don't eat)
      eatRate: 0,       // Unused for producers
      eatGain: 0,       // Unused for producers
      breedRate: 0.05,  // CRITICAL: Very slow reproduction (0.05 = 5% chance per tick)
      deathRate: 0.002, // CRITICAL: Extremely low death rate (very resilient)
      maxAge: 2000,     // CRITICAL: Extremely long lifespan (5x longer than shrubs)
      maxEnergy: 30,    // CRITICAL: Highest energy storage of all plants
      metabolism: 0,    // Plants don't lose energy per tick
      breedThreshold: 15,// CRITICAL: High energy requirement for reproduction (very selective)
      photoRate: 0.8,   // CRITICAL: Highest energy production from sunlight
      startPop: 10,     // Initial population (lowest of plants)
      description: 'Long-lived producer with high energy storage'
    },
    
    /** 
     * PRIMARY CONSUMERS (herbivores)
     * These feed directly on plants and convert plant energy into animal biomass.
     * They form the critical link between producers and predators.
     * 
     * Key balance factors: 
     * - eatRate & eatGain: Determine how effectively they convert plant energy
     * - breedRate & breedThreshold: Control population growth
     * - metabolism: Energy loss per tick (higher values require more food)
     * 
     * ECOSYSTEM EFFECTS:
     * - Too many herbivores will deplete plant populations
     * - Too few won't support predator populations
     * - Check Population Health % in the insights panel to monitor their status
     */
    insect: {
      id: 'insect',     // Unique identifier used in code
      name: 'Insect',   // Display name in UI
      emoji: '🐜',      // Visual representation
      color: '#f0f',    // Color for UI elements and graphs
      producer: false,  // FALSE for consumers (animals that eat other species)
      diet: ['grass', 'shrub'], // CRITICAL: What this species can eat - directly affects survival
      eatRate: 0.40,    // CRITICAL: Increased feeding success for better survival (40% chance per tick)
      eatGain: 3,       // CRITICAL: Increased energy gain to support metabolism
      breedRate: 0.25,  // CRITICAL: Reduced breeding rate for more stable populations
      deathRate: 0.05,  // CRITICAL: Reduced death rate from 8% to 5% for better survival
      maxAge: 100,      // CRITICAL: Increased lifespan for more stability
      maxEnergy: 8,     // CRITICAL: Increased energy storage for better survival
      metabolism: 0.3,  // CRITICAL: Reduced energy loss per tick (30% instead of 40%)
      breedThreshold: 4,// CRITICAL: Slightly higher threshold to balance increased energy gain
      startPop: 80,     // Initial population (high to support predators)
      description: 'Fast-breeding invertebrates that consume plant matter'
    },
    grasshopper: {
      id: 'grasshopper',
      name: 'Grasshopper',
      emoji: '🦗',
      color: '#8c8',
      producer: false,
      diet: ['grass'],
      eatRate: 0.30,
      eatGain: 3,
      breedRate: 0.25,
      deathRate: 0.06,
      maxAge: 120,
      maxEnergy: 7,
      metabolism: 0.35,
      breedThreshold: 4,
      startPop: 100,
      description: 'Jumping insect that feeds primarily on grasses'
    },
    rabbit: {
      id: 'rabbit',     // Unique identifier used in code
      name: 'Rabbit',   // Display name in UI
      emoji: '🐰',      // Visual representation
      color: '#ccc',    // Color for UI elements and graphs
      producer: false,  // FALSE for consumers (animals that eat other species)
      diet: ['grass', 'shrub'], // CRITICAL: Multiple food sources increases survival chances
      eatRate: 0.25,    // CRITICAL: Improved feeding success for better survival (25% chance per tick)
      eatGain: 5,       // CRITICAL: Increased energy gain to support reduced metabolism
      breedRate: 0.12,  // CRITICAL: Slightly reduced breeding for more stable populations
      deathRate: 0.02,  // CRITICAL: Reduced death rate for better survival (2% chance per tick)
      maxAge: 350,      // CRITICAL: Increased lifespan for more stability
      maxEnergy: 15,    // CRITICAL: Increased energy storage for better survival
      metabolism: 0.35, // CRITICAL: Reduced energy loss per tick (35% instead of 50%)
      breedThreshold: 8,// CRITICAL: Balanced threshold with increased energy gain
      startPop: 15,     // Initial population (balanced between insects and predators)
      description: 'Fast-breeding herbivorous mammal'
    },
    mouse: {
      id: 'mouse',
      name: 'Mouse',
      emoji: '🐭',
      color: '#ff0',
      producer: false,
      diet: ['grass', 'shrub'],
      eatRate: 0.15,
      eatGain: 3,
      breedRate: 0.18,
      deathRate: 0.04,
      maxAge: 250,
      maxEnergy: 8,
      metabolism: 0.4,
      breedThreshold: 5,
      startPop: 25,
      description: 'Small rodent that consumes seeds and plants'
    },
    deer: {
      id: 'deer',
      name: 'Deer',
      emoji: '🦌',
      color: '#a85',
      producer: false,
      diet: ['grass', 'shrub', 'tree'],
      eatRate: 0.12,
      eatGain: 6,
      breedRate: 0.06,
      deathRate: 0.02,
      maxAge: 600,
      maxEnergy: 25,
      metabolism: 0.6,
      breedThreshold: 15,
      startPop: 8,
      description: 'Large herbivore that browses on vegetation'
    },
    
    /** 
     * SECONDARY CONSUMERS (smaller predators)
     * These feed on primary consumers (herbivores) and maintain herbivore populations.
     * They're critical for preventing herbivore overpopulation and plant extinction.
     * 
     * Key balance factors: 
     * - eatRate & eatGain: Determine hunting effectiveness (lower success but higher gain)
     * - metabolism: Usually lower than herbivores (more efficient energy use)
     * - breedThreshold: Usually higher than herbivores (more selective breeding)
     * 
     * ECOSYSTEM EFFECTS:
     * - Too many predators will collapse herbivore populations
     * - Too few predators will allow herbivores to overpopulate and destroy plant populations
     * - Usually smaller populations than herbivores but longer lifespans
     */
    frog: {
      id: 'frog',
      name: 'Frog',
      emoji: '🐸',
      color: '#0c8',
      producer: false,
      diet: ['insect', 'grasshopper'],
      eatRate: 0.25,
      eatGain: 5,
      breedRate: 0.12,
      deathRate: 0.03,
      maxAge: 300,
      maxEnergy: 14,
      metabolism: 0.3,
      breedThreshold: 8,
      startPop: 12,
      description: 'Amphibian that preys on insects'
    },
    snake: {
      id: 'snake',
      name: 'Snake',
      emoji: '🐍',
      color: '#088',
      producer: false,
      diet: ['mouse', 'frog', 'grasshopper'],
      eatRate: 0.15,
      eatGain: 8,
      breedRate: 0.06,
      deathRate: 0.02,
      maxAge: 500,
      maxEnergy: 18,
      metabolism: 0.2, // Cold-blooded, lower metabolism
      breedThreshold: 12,
      startPop: 6,
      description: 'Reptile predator that hunts small animals'
    },
    fox: {
      id: 'fox',       // Unique identifier used in code
      name: 'Fox',     // Display name in UI
      emoji: '🦊',      // Visual representation
      color: '#f60',    // Color for UI elements and graphs
      producer: false,  // FALSE for consumers (animals that eat other species)
      diet: ['rabbit', 'mouse'], // CRITICAL: Note this predator targets specific prey species
      eatRate: 0.10,    // CRITICAL: Reduced hunt success for more sustainable predation (10% chance per tick)
      eatGain: 12,      // CRITICAL: Increased energy gain to compensate for lower success rate
      breedRate: 0.03,  // CRITICAL: Reduced breeding rate for more stable populations
      deathRate: 0.012, // CRITICAL: Slightly reduced death rate for better survival
      maxAge: 650,      // CRITICAL: Increased lifespan for more stability
      maxEnergy: 25,    // CRITICAL: Increased energy storage for better survival during food shortages
      metabolism: 0.5,  // CRITICAL: Reduced energy consumption for more sustainable populations
      breedThreshold: 16,// CRITICAL: Slightly higher threshold to balance increased energy gain
      startPop: 4,      // Initial population (much lower than prey species)
      description: 'Cunning predator that hunts small mammals'
    },
    owl: {
      id: 'owl',
      name: 'Owl',
      emoji: '🦉',
      color: '#c96',
      producer: false,
      diet: ['mouse', 'insect', 'grasshopper'],
      eatRate: 0.18,
      eatGain: 7,
      breedRate: 0.03,
      deathRate: 0.01,
      maxAge: 550,
      maxEnergy: 20,
      metabolism: 0.5,
      breedThreshold: 14,
      startPop: 3,
      description: 'Nocturnal predator with excellent hunting skills'
    },
    
    /** 
     * TERTIARY CONSUMERS (apex predators)
     * These represent the top of the food chain, preying on other predators and large herbivores.
     * They require the most energy and have the lowest populations but highest individual impact.
     * 
     * Key balance factors: 
     * - eatRate: Lower than other consumers (harder to catch prey)
     * - eatGain: Highest in the ecosystem (large meals)
     * - breedRate: Very low (slowest reproduction)
     * - breedThreshold: Highest energy requirements to reproduce
     * 
     * ECOSYSTEM EFFECTS:
     * - Act as keystone species that regulate entire food webs
     * - Populations are highly sensitive to prey availability
     * - Even small numbers can dramatically affect lower trophic levels
     * - Extinction can cause trophic cascades through the entire ecosystem
     */
    wolf: {
      id: 'wolf',      // Unique identifier used in code
      name: 'Wolf',    // Display name in UI
      emoji: '🐺',      // Visual representation
      color: '#559',   // Color for UI elements and graphs
      producer: false, // FALSE for consumers (animals that eat other species)
      diet: ['deer', 'fox', 'rabbit'], // CRITICAL: Note this apex predator hunts both herbivores AND other predators
      eatRate: 0.08,   // CRITICAL: Low hunt success rate (8% chance per tick) - harder to catch prey
      eatGain: 15,     // CRITICAL: Very high energy gain per feeding - largest meals in ecosystem
      breedRate: 0.02, // CRITICAL: Very slow breeding rate (2% chance when above threshold)
      deathRate: 0.01, // CRITICAL: Low natural death rate (1% chance per tick)
      maxAge: 800,     // CRITICAL: Very long lifespan (longer than most species)
      maxEnergy: 35,   // CRITICAL: Highest energy storage capacity in ecosystem
      metabolism: 0.7, // CRITICAL: High energy consumption per tick (maintains predator-prey balance)
      breedThreshold: 25, // CRITICAL: Extremely high energy requirement for reproduction
      startPop: 2,     // Initial population (smallest of all species - typical for apex predators)
      description: 'Pack-hunting apex predator that targets large herbivores'
    },
    lynx: {
      id: 'lynx',
      name: 'Lynx',
      emoji: '🐆',
      color: '#c60',
      producer: false,
      diet: ['rabbit', 'fox', 'mouse'],
      eatRate: 0.15,
      eatGain: 12,
      breedRate: 0.015,
      deathRate: 0.01,
      maxAge: 750,
      maxEnergy: 30,
      metabolism: 0.65,
      breedThreshold: 22,
      startPop: 2,
      description: 'Solitary wildcat that specializes in hunting rabbits'
    },
    eagle: {
      id: 'eagle',
      name: 'Eagle',
      emoji: '🦅',
      color: '#fff',
      producer: false,
      diet: ['snake', 'rabbit', 'mouse'],
      eatRate: 0.12,
      eatGain: 14,
      breedRate: 0.01,
      deathRate: 0.005,
      maxAge: 900,
      maxEnergy: 28,
      metabolism: 0.6,
      breedThreshold: 20,
      startPop: 2,
      description: 'Aerial apex predator with exceptional vision'
    },
    bear: {
      id: 'bear',      // Unique identifier used in code
      name: 'Bear',    // Display name in UI
      emoji: '🐻',      // Visual representation
      color: '#950',   // Color for UI elements and graphs
      producer: false, // FALSE for consumers (animals that eat other species)
      diet: ['deer', 'fox', 'rabbit', 'mouse', 'fish'], // CRITICAL: Most diverse diet of all species - extremely adaptable
      eatRate: 0.10,   // CRITICAL: Moderate hunt success rate for an apex predator (10% chance per tick)
      eatGain: 18,     // CRITICAL: Highest energy gain per feeding in the ecosystem
      breedRate: 0.01, // CRITICAL: Slowest breeding rate in ecosystem (1% chance when above threshold)
      deathRate: 0.006,// CRITICAL: Very low natural death rate (0.6% chance per tick)
      maxAge: 1000,    // CRITICAL: Longest lifespan in the ecosystem
      maxEnergy: 40,   // CRITICAL: Highest energy storage capacity (can survive longest without food)
      metabolism: 0.8, // CRITICAL: Highest energy consumption per tick (requires frequent feeding)
      breedThreshold: 30, // CRITICAL: Highest energy threshold for reproduction (most selective breeding)
      startPop: 1,     // Initial population (lowest in ecosystem - typical for top predators)
      description: 'Omnivorous apex predator with diverse diet'
    }
  },
  
  // Get all species as an array
  getAll() {
    return Object.values(this._catalogue);
  },
  
  // Get a specific species by ID
  get(id) {
    return this._catalogue[id];
  },
  
  // Get all producer species
  getProducers() {
    return this.getAll().filter(s => s.producer);
  },
  
  // Get all consumer species
  getConsumers() {
    return this.getAll().filter(s => !s.producer);
  },
  
  // Get primary consumers (herbivores)
  getHerbivores() {
    return this.getConsumers().filter(s => {
      // Species that only eat plants
      return s.diet.every(food => this.get(food)?.producer);
    });
  },
  
  // Get secondary consumers (eat herbivores)
  getSecondaryConsumers() {
    const herbivoreIds = this.getHerbivores().map(h => h.id);
    return this.getConsumers().filter(s => {
      // Species that eat at least one herbivore
      return s.diet.some(food => herbivoreIds.includes(food));
    });
  },
  
  // Get apex predators (top of food chain)
  getApexPredators() {
    const secondaryIds = this.getSecondaryConsumers().map(s => s.id);
    return this.getConsumers().filter(s => {
      // Species that eat secondary consumers
      return s.diet.some(food => secondaryIds.includes(food));
    });
  }
};

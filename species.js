// species.js - Defines all species and their properties
// Contains a complete ecosystem with plants, herbivores, carnivores and apex predators
// Parameters based on research of real ecosystems for stability

export const Species = {
  // Catalogue of all species
  _catalogue: {
    // PRODUCERS (plants) - Base of the food chain
    grass: {
      id: 'grass',
      name: 'Grass',
      emoji: '🌿',
      color: '#0f0',
      producer: true,
      diet: [],
      eatRate: 0,
      eatGain: 0,
      breedRate: 0.35, // Fast growing, resilient
      deathRate: 0.01,
      maxAge: 400,
      maxEnergy: 8,
      metabolism: 0,
      breedThreshold: 3,
      photoRate: 0.5, // Medium energy gain from sunlight
      startPop: 200, // Initial population
      description: 'Fast-growing ground cover that thrives in sunlight'
    },
    shrub: {
      id: 'shrub',
      name: 'Shrub',
      emoji: '🌱',
      color: '#0c0',
      producer: true,
      diet: [],
      eatRate: 0,
      eatGain: 0,
      breedRate: 0.15, // Medium growth rate
      deathRate: 0.008,
      maxAge: 800,
      maxEnergy: 15,
      metabolism: 0,
      breedThreshold: 6,
      photoRate: 0.6, // Higher energy gain but slower breeding
      startPop: 30,
      description: 'Woody plant that provides food and shelter for animals'
    },
    tree: {
      id: 'tree',
      name: 'Tree',
      emoji: '🌳',
      color: '#080',
      producer: true,
      diet: [],
      eatRate: 0,
      eatGain: 0,
      breedRate: 0.05, // Slow growth rate
      deathRate: 0.002,
      maxAge: 2000,
      maxEnergy: 30,
      metabolism: 0,
      breedThreshold: 15,
      photoRate: 0.8, // Highest energy production
      startPop: 10,
      description: 'Long-lived producer with high energy storage'
    },
    
    // PRIMARY CONSUMERS (herbivores)
    insect: {
      id: 'insect',
      name: 'Insect',
      emoji: '🐜',
      color: '#f0f',
      producer: false,
      diet: ['grass', 'shrub'],
      eatRate: 0.35,
      eatGain: 2,
      breedRate: 0.30, // Very fast reproduction
      deathRate: 0.08,
      maxAge: 80,
      maxEnergy: 6,
      metabolism: 0.4,
      breedThreshold: 3,
      startPop: 80,
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
      id: 'rabbit',
      name: 'Rabbit',
      emoji: '🐰',
      color: '#ccc',
      producer: false,
      diet: ['grass', 'shrub'],
      eatRate: 0.20,
      eatGain: 4,
      breedRate: 0.15, // Fast breeding mammal
      deathRate: 0.03,
      maxAge: 300,
      maxEnergy: 12,
      metabolism: 0.5,
      breedThreshold: 7,
      startPop: 15,
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
    
    // SECONDARY CONSUMERS (smaller predators)
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
      id: 'fox',
      name: 'Fox',
      emoji: '🦊',
      color: '#f60',
      producer: false,
      diet: ['rabbit', 'mouse'],
      eatRate: 0.12,
      eatGain: 10,
      breedRate: 0.04,
      deathRate: 0.015,
      maxAge: 600,
      maxEnergy: 22,
      metabolism: 0.6,
      breedThreshold: 15,
      startPop: 4,
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
    
    // TERTIARY CONSUMERS (apex predators)
    wolf: {
      id: 'wolf',
      name: 'Wolf',
      emoji: '🐺',
      color: '#88f',
      producer: false,
      diet: ['deer', 'rabbit'],
      eatRate: 0.10,
      eatGain: 15,
      breedRate: 0.02,
      deathRate: 0.008,
      maxAge: 800,
      maxEnergy: 35,
      metabolism: 0.7,
      breedThreshold: 25,
      startPop: 3,
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

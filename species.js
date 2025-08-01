/* global namespace: window.Species = { catalogue, newIndividual } */
(function () {
    const catalogue = {
      // Primary producers - automatically gains energy from environment
      plant: {
        id:'plant',emoji:'🌱',color:'#33cc33',
        eats:[],eatRate:0,
        breedRate:0.25,deathRate:0.01,maxAge:400,
        maxEnergy:12,eatGain:0,starveAt:0,hungryAt:2,
        // Plants gain energy from sunlight through photosynthesis
        photosynthesis: true,
        photoRate: 0.6,  // Rate at which plants gain energy from sun
        facts:`Primary producer that converts sunlight into energy, forming the foundation of the ecosystem.`
      },
      
      // Herbivores - primary consumers
      rabbit: {
        id:'rabbit',emoji:'🐰',color:'#cccccc',
        eats:['plant'],eatRate:0.2,
        breedRate:0.10,deathRate:0.02,maxAge:300,
        maxEnergy:15,eatGain:5,starveAt:2,hungryAt:6,
        facts:`Fast-breeding herbivores that feed on plants and are prey for many predators.`
      },
      mouse: {
        id:'mouse',emoji:'🐭',color:'#ffff66',
        eats:['plant'],eatRate:0.15,
        breedRate:0.12,deathRate:0.02,maxAge:250,
        maxEnergy:12,eatGain:4,starveAt:2,hungryAt:5,
        facts:`Small rodents that consume plants and seeds. Prolific breeders and an important food source for predators.`
      },
      
      // Omnivores - can eat both plants and small animals
      hedgehog: {
        id:'hedgehog',emoji:'🦔',color:'#996633',
        eats:['plant', 'bug'],eatRate:0.18,
        breedRate:0.05,deathRate:0.015,maxAge:450,
        maxEnergy:20,eatGain:6,starveAt:3,hungryAt:8,
        facts:`Small omnivorous mammals that eat both plants and insects. They help control pest populations.`
      },
      
      // Insects - both consumers and prey
      bug: {
        id:'bug',emoji:'🐞',color:'#ff4dff',
        eats:['plant'],eatRate:0.25,
        breedRate:0.20,deathRate:0.05,maxAge:100,
        maxEnergy:8,eatGain:3,starveAt:1,hungryAt:3,
        facts:`Small insects that feed on plants and serve as food for many other animals.`
      },
      
      // Predators - secondary and tertiary consumers
      fox: {
        id:'fox',emoji:'🦊',color:'#ff6600',
        eats:['rabbit', 'mouse', 'hedgehog'],eatRate:0.12,
        breedRate:0.03,deathRate:0.01,maxAge:500,
        maxEnergy:25,eatGain:8,starveAt:4,hungryAt:10,
        facts:`Cunning predator that hunts small mammals, helping to keep prey populations in check.`
      },
      owl: {
        id:'owl',emoji:'🦉',color:'#cc9966',
        eats:['mouse', 'bug'],eatRate:0.15,
        breedRate:0.025,deathRate:0.008,maxAge:450,
        maxEnergy:22,eatGain:7,starveAt:3,hungryAt:9,
        facts:`Nocturnal predator specializing in hunting mice and insects, an important controller of rodent populations.`
      },
    };
  
    function newIndividual (spec){ return {age:0,energy:spec.maxEnergy}; }
  
    window.Species = { catalogue, newIndividual };
  })();
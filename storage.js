/* global Sim */
(function () {
    function save () {
      localStorage.setItem('asciiSim', JSON.stringify({
        time: Sim.time,
        pop:  Sim.pop
      }));
    }
  
    function load () {
      const raw = localStorage.getItem('asciiSim');
      if (!raw) return false;
      const data = JSON.parse(raw);
      Sim.time = data.time;
      Sim.pop  = {};
      Sim.list = [];
      for (const id in data.pop) {
        Sim.pop[id]  = data.pop[id];
        Sim.list.push(Species.catalogue[id]);
      }
      return true;
    }
  
    window.Storage = { save, load };
  })();
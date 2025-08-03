import { UI } from './ui.js';
import { Sim } from './sim.js';
import { Insights } from './insights.js';
import { Storage } from './storage.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize modules
  Storage.init();
  Sim.init();
  UI.init();
  Insights.init();
  
  // Event listeners for control buttons
  document.getElementById('btn-start').addEventListener('click', () => {
    Sim.start();
    UI.updateControlState(true);
  });
  
  document.getElementById('btn-stop').addEventListener('click', () => {
    Sim.stop();
    UI.updateControlState(false);
  });
  
  // Reset button
  document.getElementById('btn-reset').addEventListener('click', () => {
    Sim.reset();
    UI.updateControlState(false);
  });
  
  // Speed control
  const speedSlider = document.getElementById('sim-speed');
  const speedValue = document.getElementById('speed-value');
  
  speedSlider.addEventListener('input', () => {
    const value = speedSlider.value;
    speedValue.textContent = value;
    Sim.setSpeed(value);
  });
  
  // Initialize the console with welcome message
  UI.log('█▀█ █▀█ █▀█ █░█ █░░ ▄▀█ ▀█▀ █ █▀█ █▄░█   █▀ █ █▀▄▀█');
  UI.log('█▀▀ █▄█ █▀▀ █▄█ █▄▄ █▀█ ░█░ █ █▄█ █░▀█   ▄█ █ █░▀░█');
  UI.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  UI.log('Welcome to the Animal Population Simulator v1.0');
  UI.log('Add species and press Start to begin the simulation');
});

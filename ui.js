// ui.js - Handles UI rendering and interactions

import { Species } from './species.js';
import { Sim } from './sim.js';

export const UI = {
  consoleElement: null,
  speciesGridElement: null,
  maxConsoleLines: 100,
  
  // Initialize the UI
  init() {
    this.consoleElement = document.getElementById('console');
    this.speciesGridElement = document.getElementById('species-grid');
    
    // Create the species grid for adding organisms
    this.createSpeciesGrid();
    
    // Add event listeners for tooltips
    document.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('has-tooltip')) {
        this.showTooltip(e);
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('has-tooltip')) {
        this.hideTooltip();
      }
    });
  },
  
  // Create the grid of available species in the controls panel
  createSpeciesGrid() {
    this.speciesGridElement.innerHTML = '';
    const allSpecies = Species.getAll();
    
    allSpecies.forEach(spec => {
      const item = document.createElement('div');
      item.className = 'species-item has-tooltip';
      item.dataset.species = spec.id;
      item.dataset.tooltip = spec.description;
      item.innerHTML = `${spec.emoji}<br>+`;
      
      // Style based on producer/consumer
      item.style.color = spec.color;
      
      // Add event listener to add individuals when clicked
      item.addEventListener('click', () => {
        Sim.addIndividuals(spec.id, 1);
      });
      
      this.speciesGridElement.appendChild(item);
    });
  },
  
  // Update control state based on simulation running state
  updateControlState(isRunning) {
    document.getElementById('btn-start').disabled = isRunning;
    document.getElementById('btn-stop').disabled = !isRunning;
  },
  
  // Log a message to the console
  log(message, type = 'info') {
    if (!this.consoleElement) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    let logClass = '';
    
    // Set CSS class based on message type
    switch (type) {
      case 'error':
        logClass = 'log-error';
        break;
      case 'warning':
        logClass = 'log-warning';
        break;
      case 'success':
        logClass = 'log-success';
        break;
      default:
        logClass = 'log-info';
    }
    
    // Create the log entry with proper styling
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${logClass}`;
    logEntry.innerHTML = `[${timestamp}] ${message}`;
    
    // Add to console
    this.consoleElement.appendChild(logEntry);
    
    // Limit console length
    while (this.consoleElement.childNodes.length > this.maxConsoleLines) {
      this.consoleElement.removeChild(this.consoleElement.firstChild);
    }
    
    // Auto-scroll to bottom
    this.consoleElement.scrollTop = this.consoleElement.scrollHeight;
  },
  
  // Show tooltip for an element
  showTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    const target = event.target;
    
    tooltip.textContent = target.dataset.tooltip;
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.removeAttribute('hidden');
  },
  
  // Hide tooltip
  hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.setAttribute('hidden', 'true');
  }
};

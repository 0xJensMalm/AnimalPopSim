// insights.js - Handles data visualization and insights panel

import { Species } from './species.js';
import { Sim } from './sim.js';

export const Insights = {
  tableElement: null,
  graphElement: null,
  currentMetric: null, // Currently selected metric for visualization
  currentSpecies: null, // Currently selected species for visualization
  isShowingLayeredView: false, // Whether we're showing all species in one graph
  
  // Initialize the insights panel
  init() {
    this.tableElement = document.getElementById('data-table');
    this.graphElement = document.getElementById('data-graph');
    
    // Track active species in the layered view
    this.activeSpecies = new Set();
    
    // Add click listener for animal population
    const totalPopElement = document.getElementById('animal-pop').parentElement;
    totalPopElement.classList.add('clickable');
    totalPopElement.addEventListener('click', () => {
      this.showLayeredGraph();
    });
    
    // Initial update - show layered graph by default
    this.update();
    this.showLayeredGraph();
  },
  
  // Update the insights panel with current data
  update() {
    this.renderTable();
    
    // If a specific metric is selected, update the graph
    if (this.currentMetric && this.currentSpecies) {
      this.renderGraph(this.currentSpecies, this.currentMetric);
    } else if (this.isShowingLayeredView) {
      this.showLayeredGraph();
    }
  },
  
  // Render the data tables (producers and consumers)
  renderTable() {
    // Clear the table area
    this.tableElement.innerHTML = '';
    
    // Create producer table
    const producers = Species.getProducers();
    if (producers.length > 0) {
      const producerTable = this.createTableSection('Producers', [
        { id: 'pop', label: 'Population' },
        { id: 'growth', label: 'Growth Rate' },
        { id: 'biomass', label: 'Total Biomass' },
        { id: 'deaths', label: 'Death Rate' }
      ]);
      
      producers.forEach(species => {
        const population = Sim.populations[species.id] || [];
        const count = population.length;
        
        // Calculate stats
        const totalBiomass = population.reduce((sum, ind) => sum + ind.energy, 0);
        const historyData = Sim.history.speciesData[species.id];
        const growthRate = this.calculateRate(historyData?.pop || []);
        const deathRate = historyData?.deaths?.length > 0 ? 
          historyData.deaths.slice(-5).reduce((sum, val) => sum + val, 0) / 5 : 0;
        
        // Create row
        const row = document.createElement('tr');
        row.style.color = species.color;
        
        // Species info cell
        const infoCell = document.createElement('td');
        infoCell.textContent = `${species.emoji} ${species.name}`;
        row.appendChild(infoCell);
        
        // Population cell (clickable)
        const popCell = this.createClickableCell(
          count, 
          () => this.renderGraph(species.id, 'pop'),
          species.id, 'pop'
        );
        row.appendChild(popCell);
        
        // Growth rate cell (clickable)
        const growthSymbol = this.getRateSymbol(growthRate);
        const growthCell = this.createClickableCell(
          `${growthSymbol} ${growthRate.toFixed(2)}`,
          () => this.renderGraph(species.id, 'growth'),
          species.id, 'growth'
        );
        row.appendChild(growthCell);
        
        // Biomass cell (clickable)
        const biomassCell = this.createClickableCell(
          Math.round(totalBiomass),
          () => this.renderGraph(species.id, 'biomass'),
          species.id, 'biomass'
        );
        row.appendChild(biomassCell);
        
        // Death rate cell (clickable)
        const deathCell = this.createClickableCell(
          deathRate.toFixed(1),
          () => this.renderGraph(species.id, 'deaths'),
          species.id, 'deaths'
        );
        row.appendChild(deathCell);
        
        producerTable.appendChild(row);
      });
      
      this.tableElement.appendChild(producerTable);
    }
    
    // Create consumer table
    const consumers = Species.getConsumers();
    if (consumers.length > 0) {
      const consumerTable = this.createTableSection('Consumers', [
        { id: 'pop', label: 'Total Pop' },
        { id: 'health', label: 'Pop Health' },
        { id: 'trend', label: 'Trend' },
        { id: 'breed', label: 'Breed Rate' },
        { id: 'death', label: 'Death Rate' },
        { id: 'energy', label: 'Avg Energy' }
      ]);
      
      consumers.forEach(species => {
        const population = Sim.populations[species.id] || [];
        const count = population.length;
        
        // Calculate stats
        const historyData = Sim.history.speciesData[species.id];
        const trend = this.calculateTrend(historyData?.pop || []);
        const trendSymbol = this.getTrendSymbol(trend);
        const avgEnergy = count > 0 ? 
          population.reduce((sum, ind) => sum + ind.energy, 0) / count : 0;
        const healthPercent = count > 0 ? 
          Math.round((avgEnergy / species.maxEnergy) * 100) : 0;
        
        // Calculate rates
        const breedRate = historyData?.births?.length > 0 ? 
          historyData.births.slice(-5).reduce((sum, val) => sum + val, 0) / 5 : 0;
        const deathRate = historyData?.deaths?.length > 0 ? 
          historyData.deaths.slice(-5).reduce((sum, val) => sum + val, 0) / 5 : 0;
        
        // Create row
        const row = document.createElement('tr');
        row.style.color = species.color;
        
        // Species info cell
        const infoCell = document.createElement('td');
        infoCell.textContent = `${species.emoji} ${species.name}`;
        row.appendChild(infoCell);
        
        // Population cell (clickable)
        const popCell = this.createClickableCell(
          count,
          () => this.renderGraph(species.id, 'pop'),
          species.id, 'pop'
        );
        row.appendChild(popCell);
        
        // Health percent cell (clickable)
        const healthCell = this.createClickableCell(
          `${healthPercent}%`,
          () => this.renderGraph(species.id, 'health'),
          species.id, 'health'
        );
        row.appendChild(healthCell);
        
        // Trend cell (clickable)
        const trendCell = this.createClickableCell(
          trendSymbol,
          () => this.renderGraph(species.id, 'pop'),
          species.id, 'trend'
        );
        row.appendChild(trendCell);
        
        // Breed rate cell (clickable)
        const breedCell = this.createClickableCell(
          breedRate.toFixed(1),
          () => this.renderGraph(species.id, 'births'),
          species.id, 'births'
        );
        row.appendChild(breedCell);
        
        // Death rate cell (clickable)
        const deathCell = this.createClickableCell(
          deathRate.toFixed(1),
          () => this.renderGraph(species.id, 'deaths'),
          species.id, 'deaths'
        );
        row.appendChild(deathCell);
        
        // Average energy cell (clickable)
        const energyCell = this.createClickableCell(
          avgEnergy.toFixed(1),
          () => this.renderGraph(species.id, 'energy'),
          species.id, 'energy'
        );
        row.appendChild(energyCell);
        
        consumerTable.appendChild(row);
      });
      
      this.tableElement.appendChild(consumerTable);
    }
  },
  
  // Create a table section with header
  createTableSection(title, columns) {
    const section = document.createElement('div');
    section.className = 'table-section';
    
    const header = document.createElement('h3');
    header.textContent = title;
    header.className = 'section-header';
    section.appendChild(header);
    
    const table = document.createElement('table');
    const tableHead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Species column
    const speciesHeader = document.createElement('th');
    speciesHeader.textContent = 'Species';
    headerRow.appendChild(speciesHeader);
    
    // Add all other column headers
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      headerRow.appendChild(th);
    });
    
    tableHead.appendChild(headerRow);
    table.appendChild(tableHead);
    
    section.appendChild(table);
    return table;
  },
  
  // Create a clickable table cell
  createClickableCell(content, onClick, speciesId, metric) {
    const cell = document.createElement('td');
    cell.className = 'clickable';
    cell.textContent = content;
    cell.addEventListener('click', onClick);
    
    // Highlight current selection
    if (this.currentSpecies === speciesId && this.currentMetric === metric) {
      cell.classList.add('selected');
    }
    
    return cell;
  },
  
  // Render a graph for the specified species and metric
  renderGraph(speciesId, metric) {
    // Update current selection
    this.currentSpecies = speciesId;
    this.currentMetric = metric;
    this.isShowingLayeredView = false;
    
    // Clear previous graph
    this.graphElement.innerHTML = '';
    
    const species = Species.get(speciesId);
    if (!species) return;
    
    const historyData = Sim.history.speciesData[speciesId];
    if (!historyData) return;
    
    let dataPoints = [];
    let title = '';
    
    // Get appropriate data based on metric
    switch (metric) {
      case 'pop':
        dataPoints = historyData.pop;
        title = `${species.emoji} ${species.name} Population`;
        break;
      case 'energy':
        dataPoints = historyData.energy;
        title = `${species.emoji} ${species.name} Average Energy`;
        break;
      case 'births':
        dataPoints = historyData.births;
        title = `${species.emoji} ${species.name} Birth Rate`;
        break;
      case 'deaths':
        dataPoints = historyData.deaths;
        title = `${species.emoji} ${species.name} Death Rate`;
        break;
      case 'health':
        // Calculate health percentage from energy and maxEnergy
        dataPoints = historyData.energy.map(e => (e / species.maxEnergy) * 100);
        title = `${species.emoji} ${species.name} Health Percentage`;
        break;
      case 'growth':
        // Use trend calculation for growth
        dataPoints = historyData.pop;
        title = `${species.emoji} ${species.name} Growth Rate`;
        break;
      case 'biomass':
        // Calculate biomass from energy
        dataPoints = historyData.energy.map((e, i) => {
          return e * historyData.pop[i];
        });
        title = `${species.emoji} ${species.name} Total Biomass`;
        break;
      default:
        dataPoints = historyData.pop;
        title = `${species.emoji} ${species.name} Population`;
    }
    
    // Create graph title
    const graphTitle = document.createElement('div');
    graphTitle.className = 'graph-title';
    graphTitle.textContent = title;
    graphTitle.style.color = species.color;
    this.graphElement.appendChild(graphTitle);
    
    // Create container for graph and legend
    const graphContent = document.createElement('div');
    graphContent.className = 'graph-content';
    
    // Create graph container and legend
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    
    const legendContainer = document.createElement('div');
    legendContainer.className = 'graph-legend';
    
    // Calculate scaling factor for graph
    const maxValue = Math.max(...dataPoints, 1);
    
    // Create SVG for better visualization
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "170");
    svg.style.backgroundColor = "rgba(0, 20, 40, 0.2)";
    
    // Add grid lines
    for (let i = 0; i <= 4; i++) {
      const line = document.createElementNS(svgNS, "line");
      const y = 180 - (i * 45);
      line.setAttribute("x1", "0");
      line.setAttribute("y1", y);
      line.setAttribute("x2", "100%");
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("stroke-dasharray", "4 2");
      svg.appendChild(line);
      
      // Add y-axis label
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", "5");
      text.setAttribute("y", y - 5);
      text.setAttribute("fill", "#999");
      text.setAttribute("font-size", "10");
      text.textContent = Math.round(maxValue * i / 4);
      svg.appendChild(text);
    }
    
    // Generate path for line graph
    const path = document.createElementNS(svgNS, "path");
    let pathData = "";
    
    // Only generate path if we have data points
    if (dataPoints.length > 0) {
      dataPoints.forEach((value, index) => {
        // Safety check to prevent division by zero
        const x = dataPoints.length > 1 ? (index / (dataPoints.length - 1)) * 100 : 0;
        const y = 180 - ((value / maxValue) * 170);
        
        if (index === 0) {
          pathData += `M ${x} ${y}`;
        } else {
          pathData += ` L ${x} ${y}`;
        }
      });
      
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", species.color);
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      svg.appendChild(path);
    }
    
    // Add data points
    dataPoints.forEach((value, index) => {
      // Safety check to prevent division by zero
      const x = dataPoints.length > 1 ? (index / (dataPoints.length - 1)) * 100 : 0;
      const y = 180 - ((value / maxValue) * 170);
      
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", "3");
      circle.setAttribute("fill", species.color);
      
      // Add tooltip functionality
      const title = document.createElementNS(svgNS, "title");
      title.textContent = `Time: ${Sim.time - dataPoints.length + index}, Value: ${value.toFixed(1)}`;
      circle.appendChild(title);
      
      svg.appendChild(circle);
    });
    
    graphContainer.appendChild(svg);
    
    // Create legend with other species
    const allSpecies = Species.getAll();
    allSpecies.forEach(s => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.style.color = s.color;
      
      // Highlight active species
      if (s.id === speciesId) {
        legendItem.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        legendItem.style.borderLeft = `3px solid ${s.color}`;
      }
      
      const currentPop = Sim.populations[s.id]?.length || 0;
      legendItem.innerHTML = `<span class="legend-color" style="background-color: ${s.color}"></span>${s.emoji} ${s.name}: ${currentPop}`;
      
      // Make legend items clickable
      legendItem.addEventListener('click', () => {
        this.renderGraph(s.id, metric);
      });
      
      legendContainer.appendChild(legendItem);
    });
    
    // Append containers to graph-content
    graphContent.appendChild(graphContainer);
    graphContent.appendChild(legendContainer);
    
    // Append graph-content to graph element
    this.graphElement.appendChild(graphContent);
    
    // Add current value indicator
    const currentValue = dataPoints[dataPoints.length - 1] || 0;
    const currentValueElem = document.createElement('div');
    currentValueElem.className = 'graph-current-value';
    currentValueElem.textContent = `Current: ${currentValue.toFixed(1)}`;
    currentValueElem.style.color = species.color;
    this.graphElement.appendChild(currentValueElem);
  },
  
  // Show layered graph with all species populations
  showLayeredGraph() {
    this.isShowingLayeredView = true;
    this.currentSpecies = null;
    this.currentMetric = null;
    
    // Clear previous graph
    this.graphElement.innerHTML = '';
    
    // Initialize active species if not already done
    if (!this.activeSpecies || this.activeSpecies.size === 0) {
      this.activeSpecies = new Set();
      Species.getAll().forEach(species => {
        this.activeSpecies.add(species.id);
      });
    }
    
    // Create graph title
    const graphTitle = document.createElement('div');
    graphTitle.className = 'graph-title';
    graphTitle.textContent = '📊 Total Population by Species';
    graphTitle.style.color = '#0ff';
    this.graphElement.appendChild(graphTitle);
    
    // Create container for graph and legend
    const graphContent = document.createElement('div');
    graphContent.className = 'graph-content';
    
    // Create graph container and legend
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    
    const legendContainer = document.createElement('div');
    legendContainer.className = 'graph-legend';
    
    // Get all active species
    const allSpecies = Species.getAll();
    
    if (allSpecies.length === 0) {
      this.graphElement.innerHTML = '<div class="graph-placeholder">No species data available</div>';
      return;
    }
    
    // Create SVG for layered line graph
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "170");
    svg.style.backgroundColor = "rgba(0, 20, 40, 0.2)";
    
    // Find max population across active species for scaling
    let maxPop = 1;
    const dataLength = Sim.history.total.pop.length;
    
    // Only include active species in max population calculation
    allSpecies.forEach(species => {
      if (this.activeSpecies.has(species.id)) {
        const popData = Sim.history.speciesData[species.id]?.pop || [];
        const speciesMax = Math.max(...popData);
        if (speciesMax > maxPop) maxPop = speciesMax;
      }
    });
    
    // Add grid lines
    for (let i = 0; i <= 4; i++) {
      const line = document.createElementNS(svgNS, "line");
      const y = 180 - (i * 45);
      line.setAttribute("x1", "0");
      line.setAttribute("y1", y);
      line.setAttribute("x2", "100%");
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("stroke-dasharray", "4 2");
      svg.appendChild(line);
      
      // Add y-axis label
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", "5");
      text.setAttribute("y", y - 5);
      text.setAttribute("fill", "#999");
      text.setAttribute("font-size", "10");
      text.textContent = Math.round(maxPop * i / 4);
      svg.appendChild(text);
    }
    
    // Draw lines for each species
    allSpecies.forEach((species, index) => {
      const popData = Sim.history.speciesData[species.id]?.pop || [];
      if (popData.length === 0) return;
      
      // Only draw if we have data AND species is active
      if (popData.length > 0 && this.activeSpecies.has(species.id)) {
        // Create path for this species
        const path = document.createElementNS(svgNS, "path");
        let pathData = "";
        
        // Generate path data
        popData.forEach((pop, i) => {
          // Safety check to prevent division by zero
          const x = dataLength > 1 ? (i / (dataLength - 1)) * 100 : 0;
          const y = 170 - ((pop / maxPop) * 160);
          
          if (i === 0) {
            pathData += `M ${x} ${y}`;
          } else {
            pathData += ` L ${x} ${y}`;
          }
        });
        
        path.setAttribute("d", pathData);
        path.setAttribute("stroke", species.color);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        
        svg.appendChild(path);
        
        // Add data points for this species
        popData.forEach((pop, i) => {
          const x = dataLength > 1 ? (i / (dataLength - 1)) * 100 : 0;
          const y = 170 - ((pop / maxPop) * 160);
          
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", x);
          circle.setAttribute("cy", y);
          circle.setAttribute("r", "2");
          circle.setAttribute("fill", species.color);
          
          svg.appendChild(circle);
        });
      }
      
      // Add to scrollable legend
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      
      // Apply visual cue for active/inactive species
      if (this.activeSpecies.has(species.id)) {
        legendItem.style.color = species.color;
        legendItem.style.opacity = '1';
      } else {
        legendItem.style.color = '#888';
        legendItem.style.opacity = '0.7';
      }
      
      // Current population and click to toggle this species
      const currentPop = Sim.populations[species.id]?.length || 0;
      legendItem.innerHTML = `<span class="legend-color" style="background-color: ${this.activeSpecies.has(species.id) ? species.color : '#555'}"></span>${species.emoji} ${species.name}: ${currentPop}`;
      
      // Make legend items clickable to toggle this species
      legendItem.addEventListener('click', () => {
        if (this.activeSpecies.has(species.id)) {
          this.activeSpecies.delete(species.id);
        } else {
          this.activeSpecies.add(species.id);
        }
        // Re-render the graph with updated active species
        this.showLayeredGraph();
      });
      
      legendContainer.appendChild(legendItem);
    });
    
    // Add SVG to graph container
    graphContainer.appendChild(svg);
    
    // Append containers to graph-content
    graphContent.appendChild(graphContainer);
    graphContent.appendChild(legendContainer);
    
    // Append graph-content to graph element
    this.graphElement.appendChild(graphContent);
  },
  
  // Helper: Calculate population trend
  calculateTrend(popHistory) {
    if (!popHistory || popHistory.length < 5) return 0;
    
    // Use last 5 data points to determine trend
    const recent = popHistory.slice(-5);
    
    // Simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = recent.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recent[i];
      sumXY += i * recent[i];
      sumX2 += i * i;
    }
    
    // Calculate slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  },
  
  // Helper: Get trend symbol based on direction
  getTrendSymbol(trend) {
    if (trend > 0.5) return '↗️'; // Rising
    if (trend < -0.5) return '↘️'; // Falling
    return '→'; // Stable
  },
  
  // Helper: Calculate rate of change
  calculateRate(history) {
    if (!history || history.length < 5) return 0;
    
    const recent = history.slice(-5);
    if (recent[0] === 0) return 0;
    
    const start = recent[0];
    const end = recent[recent.length - 1];
    return (end - start) / start;
  },
  
  // Helper: Get rate symbol
  getRateSymbol(rate) {
    if (rate > 0.1) return '+';
    if (rate < -0.1) return '-';
    return '=';
  }
};

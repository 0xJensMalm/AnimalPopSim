# Animal Population Simulation

A low-tech ASCII-styled ecosystem simulator that models population dynamics between different species in a simple, engaging interface.

![Animal Population Simulator](https://placeholder-for-screenshot.png)

## Getting Started

### Quick Start

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. Click the "Start" button to begin the simulation
4. Watch as the ecosystem evolves based on the interaction of different species

No installation or build process required - this simulation runs entirely in your browser using vanilla JavaScript.

## What It Does

Animal Population Simulation models a simplified ecosystem with:

- **Producers** (plants) that generate biomass
- **Consumers** (animals like mosquitoes, mice, and foxes) that feed, breed, and die based on energy levels

The simulation runs on a tick-based system where each tick represents a time unit in the ecosystem. As the simulation progresses, you can observe:

- Population booms and crashes
- Predator-prey relationships
- Extinction events
- Ecosystem stabilization (or collapse!)

### Key Features

- **Real-time Data Visualization**: Interactive tables and graphs showing population trends
- **Comprehensive Insights Panel**: Monitor vital statistics like:
  - Population counts and trends (↗️ increasing, ↘️ decreasing, → steady)
  - Growth and death rates
  - Breeding patterns
  - Energy levels and health percentages
- **Interactive Controls**: Pause, resume, or reset the simulation at any time
- **Layered Graph View**: See all species populations plotted together with color-coding
- **Persistent Storage**: Save and load simulation states using your browser's local storage

## Technical Overview

### Technology Stack

Animal Population Simulation is built with:

- **HTML5**: For structure and content
- **CSS3**: For styling and layout (using CSS Grid for the 2-column interface)
- **Vanilla JavaScript**: For all functionality and interactivity

The project intentionally avoids external frameworks or dependencies to maintain simplicity.

### Core Components

The simulation is structured around four main JavaScript files:

1. **sim.js**: The simulation engine that handles:
   - Population dynamics
   - Breeding mechanics
   - Feeding behaviors
   - Death conditions
   - History tracking for statistical analysis

2. **species.js**: Defines the properties and behaviors of different species:
   - Energy requirements
   - Reproduction rates
   - Feeding preferences
   - Maximum population constraints

3. **ui.js**: Manages the user interface:
   - ASCII/emoji-based visualization
   - Interactive data tables
   - SVG-based graph rendering
   - Console output for significant events

4. **storage.js**: Handles saving and loading simulation states using localStorage

### How It Works

The simulation operates on simple rules that create complex emergent behaviors:

1. **Producers** (plants) generate biomass at defined growth rates
2. **Consumers** (animals) must maintain energy by feeding:
   - Herbivores feed on plants
   - Predators feed on other animals
3. **Energy System**:
   - Animals lose energy each tick
   - If energy falls too low, animals die
   - Sufficient energy enables breeding
4. **Population Control**:
   - Limited resources create competition
   - Predator-prey relationships regulate populations
   - Environmental carrying capacity affects all species

The beauty of the simulation lies in how these simple rules interact to create realistic ecosystem dynamics without hard-coded behaviors.

## Contributing

Contributions are welcome! Feel free to fork the project and submit pull requests with new features or improvements.

## License

[Insert appropriate license information here]

# Animal Population Simulator (ASCII TUI)

A minimal, dependency-free ASCII terminal app for exploring predator-prey dynamics in real-time. Tweak parameters on the fly and watch populations evolve via an ASCII dashboard and chart.

- 100% ASCII (no colors or special Unicode required)
- Zero external dependencies (uses Python standard library `curses`)
- Simple controls to pause, reset, and adjust model parameters

## Quick Start

Requirements:
- macOS or Linux terminal (Windows users can use WSL)
- Python 3.9+

Run:
```bash
python3 app.py
```

Exit at any time with `q`.

## Controls
- `q` — quit
- `SPACE` — pause/resume
- `r` — reset populations
- `TAB` — cycle parameter selection
- `UP/DOWN` — move selection
- `LEFT/RIGHT` — decrease/increase selected parameter
- `-` / `+` — slow down / speed up simulation step
- `n` — toggle noise on/off
- `c` — toggle color on/off (if terminal supports colors)

## Model
A simple predator-prey (Lotka–Volterra with logistic prey growth):

- Prey logistic growth with carrying capacity `K`
- Predation reduces prey; converts to predator growth with efficiency `e`
- Predator natural death `d`

Discrete-time Euler update (clamped to non-negative values):

```
prey'     = prey + dt * ( a*prey*(1 - prey/K) - b*prey*pred )
predator' = predator + dt * ( e*b*prey*pred - d*predator )
```

Where:
- `a` = prey birth rate
- `b` = predation rate
- `e` = predator efficiency
- `d` = predator death rate
- `K` = carrying capacity
- `dt` = time step

Optional small multiplicative noise can be toggled for more organic dynamics.

### Colors
If your terminal supports colors, the TUI uses:
- Cyan: header/footer
- Magenta: labels/legend
- Green: prey sparkline and grid cells `#`
- Red: predator sparkline and grid cells `*`
- Yellow: mixed cells `@`
Toggle with `c`.

## Notes
- Resize your terminal for a wider chart.
- If your terminal lacks full-screen capabilities, try a different terminal emulator.

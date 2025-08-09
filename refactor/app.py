#!/usr/bin/env python3
"""
ASCII PopSim — Multi-species ASCII simulator

Controls:
  q           Quit
  SPACE       Pause/Resume
  r           Reset populations
  TAB         Cycle species selection
  UP/DOWN     Move selection
  ENTER       Add +10 to selected species
  - / +       Slow down / Speed up simulation
  n           Toggle noise
  c           Toggle color (if supported)

Requires: Python 3.9+, Unix-like terminal. Uses curses only (std lib).
"""
import curses
import time
import math
import random
from dataclasses import dataclass, replace


@dataclass
class Params:
    # Global dynamics
    dt: float = 0.1            # time step
    noise: bool = False
    step_delay: float = 0.05   # wall time per step (seconds)
    use_color: bool = True     # attempt to use color if terminal supports
    # Resource (sunlight) dynamics
    solar_input: float = 50.0  # sunlight added per second
    S_max: float = 500.0       # sunlight storage cap
    # Interaction rates (legacy names kept for compatibility but not used)
    b_herb: float = 0.005
    b_pred: float = 0.004
    e_herb: float = 0.2
    e_pred: float = 0.15
    # Explicit food chain: Grass -> Grasshoppers -> Frogs -> Snakes -> Eagles
    b_g_h: float = 0.006    # grass -> grasshopper consumption rate
    e_g_h: float = 0.20     # grasshopper conversion efficiency
    # Base interactions kept above for first two links; below for higher links
    b_h_f: float = 0.004    # grasshopper -> frog
    e_h_f: float = 0.18
    b_f_s: float = 0.003    # frog -> snake
    e_f_s: float = 0.16
    b_s_e: float = 0.002    # snake -> eagle
    e_s_e: float = 0.14
    # Grass extra death pressure from grasshoppers
    k_grass_hopper_death: float = 0.0005


@dataclass
class Species:
    name: str
    symbol: str
    color_pair: int
    pop: float
    growth: float  # intrinsic growth/birth
    death: float   # natural death
    last_g: float = 0.0  # last-tick gross growth
    last_d: float = 0.0  # last-tick gross death
    last_grate: float = 0.0  # per-capita growth rate per sec
    last_drate: float = 0.0  # per-capita death rate per sec


@dataclass
class State:
    species: list
    sunlight: float = 200.0
    t: float = 0.0
    paused: bool = False
    selected_species: int = 0
    log: list = None
    last_log_bucket: int = -1


PARAM_META = [
    ("a", 0.01, 5.0, 0.01),
    ("b", 0.001, 0.2, 0.001),
    ("e", 0.01, 1.0, 0.01),
    ("d", 0.01, 2.0, 0.01),
    ("K", 10.0, 10000.0, 10.0),
    ("dt", 0.005, 0.5, 0.005),
]


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def euler_step(s: State, p: Params) -> State:
    """Advance multi-species system one Euler step.
    Species indices: 0=Grass, 1=Grasshoppers, 2=Frogs, 3=Snakes, 4=Eagles.
    """
    dt = p.dt
    species = [replace(sp) for sp in s.species]

    # Noise factor for interactions
    nf = random.uniform(0.98, 1.02) if p.noise else 1.0

    grass, hopper, frog, snake, eagle = species

    # Sunlight inflow and cap
    sunlight = min(p.S_max, s.sunlight + p.solar_input * dt)

    # Grass growth depends on sunlight; death increases with grasshoppers
    sunlight_level = max(0.0, min(1.0, sunlight / max(1e-6, p.S_max)))
    grass_uptake = min(sunlight, (grass.growth * sunlight_level) * grass.pop * dt)
    sunlight -= grass_uptake
    hopper_pressure = p.k_grass_hopper_death * hopper.pop * dt
    grass_nat_death = grass.death * grass.pop * dt
    grass.last_g = grass_uptake
    grass.last_d = min(grass.pop, grass_nat_death + hopper_pressure)
    d_grass = grass.last_g - grass.last_d

    # Grasshoppers eat grass
    hop_intake = p.b_g_h * grass.pop * hopper.pop * nf * dt
    hop_intake = min(hop_intake, grass.pop)
    d_grass -= hop_intake
    hopper.last_g = p.e_g_h * hop_intake
    hopper.last_d = hopper.death * hopper.pop * dt
    d_hopper = hopper.last_g - hopper.last_d

    # Frogs eat grasshoppers
    frog_intake = p.b_h_f * hopper.pop * frog.pop * nf * dt
    frog_intake = min(frog_intake, hopper.pop)
    d_hopper -= frog_intake
    frog.last_g = p.e_h_f * frog_intake
    frog.last_d = frog.death * frog.pop * dt
    d_frog = frog.last_g - frog.last_d

    # Snakes eat frogs
    snake_intake = p.b_f_s * frog.pop * snake.pop * nf * dt
    snake_intake = min(snake_intake, frog.pop)
    d_frog -= snake_intake
    snake.last_g = p.e_f_s * snake_intake
    snake.last_d = snake.death * snake.pop * dt
    d_snake = snake.last_g - snake.last_d

    # Eagles eat snakes
    eagle_intake = p.b_s_e * snake.pop * eagle.pop * nf * dt
    eagle_intake = min(eagle_intake, snake.pop)
    d_snake -= eagle_intake
    eagle.last_g = p.e_s_e * eagle_intake
    eagle.last_d = eagle.death * eagle.pop * dt
    d_eagle = eagle.last_g - eagle.last_d

    # Apply updates and clamp
    grass.pop = max(0.0, grass.pop + d_grass)
    hopper.pop = max(0.0, hopper.pop + d_hopper)
    frog.pop = max(0.0, frog.pop + d_frog)
    snake.pop = max(0.0, snake.pop + d_snake)
    eagle.pop = max(0.0, eagle.pop + d_eagle)

    # Compute per-capita per-second rates for logging
    for sp in species:
        denom = max(1.0, sp.pop)
        sp.last_grate = (sp.last_g / denom) / max(1e-6, dt)
        sp.last_drate = (sp.last_d / denom) / max(1e-6, dt)

    species[0], species[1], species[2], species[3], species[4] = grass, hopper, frog, snake, eagle

    # Logging: periodic 5s summary only
    log = s.log or []
    def push(msg):
        log.append(f"t={s.t:.1f} {msg}")
        if len(log) > 8:
            del log[0]

    # Every 5 seconds, report highest growth/death rates
    bucket = int((s.t + dt)) // 5
    if bucket != s.last_log_bucket:
        max_g = max(species, key=lambda sp: sp.last_grate)
        max_d = max(species, key=lambda sp: sp.last_drate)
        push(f"highest growth rate: {max_g.name}: {max_g.last_grate:.2f}. highest death rate {max_d.name}: {max_d.last_drate:.2f}")
        last_log_bucket = bucket
    else:
        last_log_bucket = s.last_log_bucket

    return replace(s, species=species, sunlight=sunlight, t=s.t + dt, log=log, last_log_bucket=last_log_bucket)


def draw_box(stdscr, y, x, h, w, title=None):
    """Draw a simple ASCII box, safely clamped to the screen size."""
    H, W = stdscr.getmaxyx()
    if y >= H or x >= W:
        return
    h = max(3, min(h, max(0, H - y)))
    w = max(4, min(w, max(0, W - x)))
    if h < 3 or w < 4:
        return
    try:
        stdscr.addstr(y, x, "+" + "-" * (w - 2) + "+")
        for i in range(1, h - 1):
            stdscr.addstr(y + i, x, "|")
            stdscr.addstr(y + i, x + w - 1, "|")
        stdscr.addstr(y + h - 1, x, "+" + "-" * (w - 2) + "+")
        if title:
            title_str = f"[ {title} ]"
            pos = x + max(2, (w - len(title_str)) // 2)
            pos = min(pos, x + w - len(title_str) - 2)
            if len(title_str) < w - 2:
                stdscr.addstr(y, pos, title_str)
    except curses.error:
        pass


def sparkline(values, width):
    # Simple vertical bar sparkline using ASCII heights 0..9
    if width <= 0:
        return ""
    if not values:
        return " " * width

    vals = values[-width:]
    vmin = min(vals)
    vmax = max(vals)
    if math.isclose(vmin, vmax):
        return "0" * len(vals)
    chars = "0123456789"
    out = []
    for v in vals:
        t = (v - vmin) / (vmax - vmin)
        idx = int(t * (len(chars) - 1))
        out.append(chars[idx])
    return "".join(out)


def _init_colors(stdscr, p: Params):
    """Initialize color pairs if terminal supports them. Returns bool success."""
    try:
        if not curses.has_colors() or not p.use_color:
            return False
        curses.start_color()
        curses.use_default_colors()
        # Define pairs: 1 header, 2 plants, 3 predators, 4 herbivores, 5 labels, 6 omnivores, 7 superpredators
        curses.init_pair(1, curses.COLOR_CYAN, -1)
        curses.init_pair(2, curses.COLOR_GREEN, -1)
        curses.init_pair(3, curses.COLOR_RED, -1)
        curses.init_pair(4, curses.COLOR_YELLOW, -1)
        curses.init_pair(5, curses.COLOR_MAGENTA, -1)
        # Fallbacks if terminal limited: choose contrasting colors but keep valid indices
        fg6 = curses.COLOR_BLUE if hasattr(curses, 'COLOR_BLUE') else curses.COLOR_CYAN
        fg7 = curses.COLOR_WHITE if hasattr(curses, 'COLOR_WHITE') else curses.COLOR_MAGENTA
        curses.init_pair(6, fg6, -1)
        curses.init_pair(7, fg7, -1)
        return True
    except Exception:
        return False


def _caddstr(stdscr, y, x, text, pair=0, enable=False):
    if enable and pair:
        stdscr.addstr(y, x, text, curses.color_pair(pair))
    else:
        stdscr.addstr(y, x, text)


def render_logo(stdscr, top_y, width, color_on):
    """Render a centered ASCII 'PopSim' logo with simple color cycling."""
    logo = [
        "  ____            ____ _           ",
        " |  _ \\ ___  ___/ ___| |__   ___  ",
        " | |_) / _ \\ / _ \\\___ \\ '_ \\ / _ \\ ",
        " |  __/ (_) | (_) |___) | | | |  __/",
        " |_|   \\___/ \\___/|____/|_| |_|\\___|",
        "            PopSim                   ",
    ]
    # Color cycle across pairs for a subtle gradient
    palette = [2, 4, 6, 3, 7, 1]
    for i, line in enumerate(logo):
        line = line.rstrip("\n")
        x = max(0, (width - len(line)) // 2)
        for j, ch in enumerate(line):
            pair = palette[(i + j) % len(palette)]
            _caddstr(stdscr, top_y + i, x + j, ch, pair=pair, enable=color_on)
    return top_y + len(logo)


def render(stdscr, s: State, p: Params, history):
    stdscr.erase()
    H, W = stdscr.getmaxyx()
    color_on = _init_colors(stdscr, p)

    # Layout (wider left pane for full labels)
    side_w = min(56, max(40, (W * 2) // 5))
    chart_h = max(10, H - 12)
    chart_w = max(20, W - side_w - 4)

    # Logo + Header
    cur_y = 0
    cur_y = render_logo(stdscr, cur_y, W, color_on) + 1
    header = "q:quit SPACE:pause r:reset TAB/↑/↓:select ENTER:+10 ←/→:growth [ ]:death +/-:speed n:noise c:color"
    _caddstr(stdscr, cur_y, 0, header[: max(0, W - 1)], pair=1, enable=color_on)
    cur_y += 1

    # Stats
    draw_box(stdscr, cur_y, 0, 8, side_w, title="Stats")
    total_biomass = sum(sp.pop for sp in s.species)
    total_animals = sum(s.species[i].pop for i in range(1, len(s.species)))
    lines = [
        f"Time: {s.t:8.2f}  {'PAUSED' if s.paused else 'RUNNING'}",
        f"Total biomass: {total_biomass:8.2f}",
        f"Sunlight:      {s.sunlight:8.2f}/{p.S_max:.0f}",
        f"Animals total: {total_animals:8.2f}",
        f"dt: {p.dt:.3f}  step:{p.step_delay:.2f}s  noise:{'ON' if p.noise else 'OFF'}",
    ]
    for i, line in enumerate(lines):
        _caddstr(stdscr, cur_y + 1 + i, 2, line[: side_w - 4], pair=5, enable=color_on)

    # Species table
    table_h = max(10, len(s.species) + 10)
    table_top = cur_y + 8
    draw_box(stdscr, table_top, 0, table_h, side_w, title="Species (ENTER:+10  ←/→ growth  [ ] death)")
    _caddstr(stdscr, table_top + 1, 2, f"{'Sel':3} {'Name':12} {'pop':>9} {'gRate':>8} {'dRate':>8} {'last+':>9} {'last-':>9}", pair=5, enable=color_on)
    for i, sp in enumerate(s.species):
        sel = '->' if i == s.selected_species else '  '
        txt = f"{sel:3} {sp.name:12} {sp.pop:9.1f} {sp.last_grate:8.3f} {sp.last_drate:8.3f} {sp.last_g:9.2f} {sp.last_d:9.2f}"
        _caddstr(stdscr, table_top + 2 + i, 2, txt[: side_w - 4], pair=sp.color_pair, enable=color_on)

    # Console log below table
    log_top = table_top + 2 + len(s.species) + 1
    log_h = max(3, 9)
    draw_box(stdscr, log_top, 0, log_h, side_w, title="Log (5s rate summary)")
    if s.log:
        for i, line in enumerate(s.log[-(log_h-2):]):
            _caddstr(stdscr, log_top + 1 + i, 2, line[: side_w - 4], pair=5, enable=color_on)

    # Right viz
    draw_box(stdscr, cur_y, side_w + 1, chart_h + 2, chart_w, title="Ecosystem Mix")

    # Show stacked proportion grid based on current mix
    grid_top = cur_y + 1
    grid_h = chart_h
    grid_w = chart_w - 2
    total = max(1e-6, sum(sp.pop for sp in s.species))
    counts = [int((sp.pop / total) * grid_w) for sp in s.species]
    # Adjust to fit exactly grid_w
    while sum(counts) < grid_w:
        # add to the species with largest remainder
        fracs = [(sp.pop / total) * grid_w - counts[idx] for idx, sp in enumerate(s.species)]
        idx = max(range(len(counts)), key=lambda k: fracs[k])
        counts[idx] += 1
    bar = []
    for sp, c in zip(s.species, counts):
        bar.extend([sp.symbol] * c)
    bar_str = ''.join(bar[:grid_w])

    # Paint many rows with slight vertical animation using history
    offset = int(s.t) % max(1, grid_h - 2)
    for r in range(grid_h - 2):
        y = grid_top + r
        row = bar_str
        # draw with per-char color
        for x, ch in enumerate(row):
            # map symbol to species color
            sp = next((sp for sp in s.species if sp.symbol == ch), None)
            pair = sp.color_pair if sp else 0
            _caddstr(stdscr, y, side_w + 2 + x, ch, pair=pair, enable=color_on)

    # Footer
    footer = "TAB/↑/↓ select • ENTER +10 • ←/→ grow • [ ] death • +/- speed • n noise • c color • r reset • SPACE pause • q quit"
    _caddstr(stdscr, H - 1, 0, footer[: max(0, W - 1)], pair=1, enable=color_on)

    stdscr.refresh()


def handle_input(stdscr, s: State, p: Params):
    key = stdscr.getch()
    if key == -1:
        return s, p, False
    if key in (ord("q"), ord("Q")):
        raise KeyboardInterrupt
    if key == ord(" "):
        s.paused = not s.paused
        return s, p, True
    if key in (ord("r"), ord("R")):
        # reset populations and time
        for sp in s.species:
            if sp.name == 'Grass':
                sp.pop = 200.0
            elif sp.name == 'Grasshoppers':
                sp.pop = 60.0
            elif sp.name == 'Frogs':
                sp.pop = 25.0
            elif sp.name == 'Snakes':
                sp.pop = 12.0
            elif sp.name == 'Eagles':
                sp.pop = 6.0
        s.sunlight = 200.0
        s.t = 0.0
        return s, p, True
    if key in (9,):  # TAB
        s.selected_species = (s.selected_species + 1) % len(s.species)
        return s, p, True
    if key == curses.KEY_UP:
        s.selected_species = (s.selected_species - 1) % len(s.species)
        return s, p, True
    if key == curses.KEY_DOWN:
        s.selected_species = (s.selected_species + 1) % len(s.species)
        return s, p, True
    if key in (ord("n"), ord("N")):
        p.noise = not p.noise
        return s, p, True
    if key in (ord("c"), ord("C")):
        p.use_color = not p.use_color
        return s, p, True
    if key in (ord("-"), curses.KEY_SLEFT):
        p.step_delay = clamp(p.step_delay + 0.02, 0.0, 1.0)
        return s, p, True
    if key in (ord("+"), ord("="), curses.KEY_SRIGHT):
        p.step_delay = clamp(p.step_delay - 0.02, 0.0, 1.0)
        return s, p, True
    if key in (curses.KEY_LEFT, curses.KEY_RIGHT):
        sp = s.species[s.selected_species]
        delta = -0.01 if key == curses.KEY_LEFT else 0.01
        sp.growth = max(0.0, sp.growth + delta)
        return s, p, True
    if key in (ord('['), ord(']')):
        sp = s.species[s.selected_species]
        delta = -0.01 if key == ord('[') else 0.01
        sp.death = max(0.0, sp.death + delta)
        return s, p, True
    if key in (10, 13):  # Enter
        s.species[s.selected_species].pop += 10.0
        return s, p, True
    return s, p, False


def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.keypad(True)

    p = Params()
    # Initialize species: Grass, Grasshoppers, Frogs, Snakes, Eagles
    species_init = [
        Species(name='Grass',        symbol='.', color_pair=2, pop=200.0, growth=0.5,  death=0.05),
        Species(name='Grasshoppers', symbol='h', color_pair=4, pop=60.0,  growth=0.30, death=0.10),
        Species(name='Frogs',        symbol='f', color_pair=6, pop=25.0,  growth=0.22, death=0.12),
        Species(name='Snakes',       symbol='s', color_pair=3, pop=12.0,  growth=0.20, death=0.14),
        Species(name='Eagles',       symbol='e', color_pair=7, pop=6.0,   growth=0.18, death=0.15),
    ]
    s = State(species=species_init, log=[])
    history = []  # could hold totals for future charts

    last_render = 0.0
    while True:
        try:
            s, p, _ = handle_input(stdscr, s, p)
            if not s.paused:
                s = euler_step(s, p)
                # Track total biomass history (optional)
                history.append(sum(sp.pop for sp in s.species))
                if len(history) > 1000:
                    history = history[-800:]

            now = time.time()
            if now - last_render > 0.03:  # ~33 FPS max
                render(stdscr, s, p, history)
                last_render = now

            time.sleep(max(0.0, p.step_delay))
        except KeyboardInterrupt:
            break


def run():
    curses.wrapper(main)


if __name__ == "__main__":
    run()

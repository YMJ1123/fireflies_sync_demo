# Mirollo–Strogatz Sync Demo + Interactive Kuramoto

An educational, browser-based visualization of pulse-coupled oscillator synchronization (Mirollo–Strogatz) and an interactive Kuramoto fireflies simulation.

Open-source, zero-build: just open `index.html` in your browser.

## Contents
- Mirollo–Strogatz (MS) simulation with firing events and glow
- Interactive Kuramoto simulation (random scatter of fireflies) with live order parameter R(t)
- Jupyter notebook (`test.ipynb`) for offline experiments and MP4 export

## Quick Start
1. Download/clone this repo
2. Open `index.html` in a modern browser (Chrome/Edge/Firefox/Safari)

No server or build step required.

## Controls (Web UI)
### Mirollo–Strogatz
- Oscillator count: number of oscillators in the ring
- Coupling strength: ε for the pulse increment
- Buttons: Randomize, Play/Pause, Reset
- Stats: Sync level, Fire count, Time steps

### Kuramoto (Interactive)
- N: number of fireflies
- Coupling K: interaction strength
- Natural mean frequency ω0: shifts all current frequencies in real-time
- Time step dt: numerical step (smaller → smoother, slower)
- Buttons: Randomize, Play/Pause, Reset
- Live R(t): displayed on the progress bar and in the canvas header

## Files
- `index.html` — Page structure and UI
- `style.css` — Styling and layout
- `app.js` — Both simulators (MS and Kuramoto) and all interaction logic
- `test.ipynb` — Kuramoto experiments, flashing detection, MP4 export, and R(t) plotting

## Notebook (MP4 Export)
The notebook uses Matplotlib’s `FFMpegWriter` to export MP4.
- Recommended (Windows/macOS/Linux): install ffmpeg via Conda:
  - `conda install -c conda-forge ffmpeg`
- Alternatively, auto-locate with `imageio-ffmpeg` (already used in the notebook):
  - `%pip install imageio-ffmpeg`

If you see "FFmpeg not found" during save, install ffmpeg and rerun the export cell.

## Troubleshooting
- Animation feels too fast/slow: adjust `dt` (integration step) or `fps` (export)
- Instant synchronization: lower `K` (Kuramoto) or randomize initial conditions
- Performance: reduce `N` or increase `dt` slightly
- Canvas too small: resize browser window; canvases are responsive

## License
MIT
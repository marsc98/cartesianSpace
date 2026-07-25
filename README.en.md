# Espaço Cartesiano

Espaço Cartesiano started as a college capstone project. One day, talking with my girlfriend, she mentioned how she "draws in the air" to think things through — that phrase became the insight that made me want to build a "whiteboard" for drawing and demonstrations. To bring math closer to people, I started studying animation through the Chris Courses channel and looked for more ways to show math in several forms on the same platform, without making it feel like a rigid step-by-step tutorial — instead letting the user actually "visualize" math, and, if they're curious, inspect the calculations behind movement, rotation, the drawing itself... Espaço Cartesiano became an interactive "3D whiteboard". The app lets users demonstrate functions, plot geometries, freehand draw, and animate items in the space.

**Try it:** [espaco-cartesiano.com.br](https://espaco-cartesiano.com.br)

[🇧🇷 Português](README.md) | 🇺🇸 English

---

## Commands

### Development

```bash
yarn install     # install dependencies
yarn start       # start the dev server on port 3001
```

### Build and Deploy

```bash
yarn build       # generate the production bundle in dist/
yarn deploy      # deploy to Azion + manual WASM file upload to storage
```

> **Warning:** always use `yarn deploy` instead of `azion deploy` directly.
> The Azion CLI does not include `.wasm` files in the automatic storage upload — the deploy
> script works around this by uploading it manually after the standard deploy.

### URL Parameters

| Parameter     | Description              |
| ------------- | ------------------------- |
| _(none)_      | Opens the default 3D board |
| `?board=true` | Opens the legacy 2D board  |

---

## Stack

| Layer           | Technology                      |
| --------------- | -------------------------------- |
| Framework       | React 19 + Vite                 |
| 3D Rendering    | Three.js                        |
| Performance     | WebAssembly (Rust → `.wasm`)    |
| Math            | mathjs                          |
| Styling         | CSS Modules (SCSS)              |
| Deploy          | Azion Edge (CDN + Edge Storage) |

---

## Architecture and how the technologies connect

### Overview

```
User input (mouse / touch)
        │
        ▼
  React + Contexts
        │
        ▼
  Drawing Pipeline
   ┌────────────┐    ┌─────────────────┐    ┌────────────┐
   │ Raw Coords │───▶│  WASM Optimizer │───▶│  Three.js  │
   │ (Float32)  │    │ (RDP + cylinder)│    │  Renderer  │
   └────────────┘    └─────────────────┘    └────────────┘
                                                   │
                                                   ▼
                                             Scene (Three.js)
                                           elementsStackRef
```

### React + Contexts

Application state is distributed across **8 independent contexts**, mounted in `AppProviders`:

| Context            | Responsibility                                                |
| ------------------ | -------------------------------------------------------------- |
| `SessionContext`   | Session data: current color, mobile device, time counter       |
| `SceneContext`     | Three.js refs: scene, renderer, element stack                  |
| `UIContext`        | UI state: open modal, active editing mode                      |
| `DrawingContext`   | State of the in-progress stroke                                 |
| `ElementsContext`  | CRUD of elements present in the scene                           |
| `HistoryContext`   | Undo/redo                                                       |
| `CameraContext`    | Camera position and behavior                                    |
| `FunctionsContext` | Plotted mathematical functions                                   |

No external global state (Redux, Zustand) — contexts are sufficient for the project's scope and keep coupling low.

### Three.js

The 3D board is rendered entirely with Three.js via a canvas mounted through a ref (`mountRef`). All elements (strokes, functions, planes, geometries) are Three.js objects added to `sceneRef` and indexed in `elementsStackRef` (a `Map` keyed by id).

The animation loop runs continuously via `requestAnimationFrame` and is responsible for rendering the scene, processing element animations, and updating the camera.

### Drawing pipeline and WebAssembly

When the user draws freehand, raw 3D coordinates are captured continuously into a pre-allocated `Float32Array`. Once the stroke is finished, that array goes through the pipeline:

```
src/lib/drawing/tracePipeline.ts
   └── traceOptimizer.ts
         └── lib/wasm/index.ts  →  optimize_trace() (Rust/WASM)
               └── traceRenderer.ts  →  Three.js mesh
```

The WASM module (`trace_opt.wasm`) performs two operations in Rust:

1. **Ramer-Douglas-Peucker (RDP):** simplifies the polyline by removing redundant points based on an `epsilon` tolerance. This reduces strokes from thousands of points down to dozens while keeping the visual shape.

2. **Cylinder generation:** for each simplified segment, it generates rings of vertices around the stroke's direction (`nRing` vertices per ring, with a radius proportional to brush size). The result is the 3D positions of a particle system that forms the rendered stroke.

Communication with WASM uses **shared memory** directly: input coords are written to the buffer exported by the module (`input_ptr`), the function is called, and output positions are read from the output buffer (`output_ptr`) with no extra copy between JS and WASM.

### Deploy on Azion

The app is served as a static SPA on Azion's edge. Azion's Rules Engine has two request rules in priority order:

1. **Serve static assets** — files matching a regex of known extensions (`.js`, `.css`, `.wasm`, etc.) are served directly from Edge Storage.
2. **Catch-all SPA** — any other route is rewritten to `index.html`, letting React Router (or URL parameters) control navigation.

The `azion.config.cjs` file defines these rules and is applied on every `azion deploy`.

> **Important detail:** the Azion CLI does not upload `.wasm` files automatically.
> The `deploy` script in `package.json` works around this with an `azion create storage object`
> call after the standard deploy. If the bucket or prefix changes (see `azion/azion.json`),
> the script needs to be updated manually.

---

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

You may study, run, and adapt the code for non-commercial purposes.
For commercial use, get in touch before using it.

# TuneGraph-Iteration
Iteration project on Tunegraph. To see the original repo, visit: [Tunegraph](https://github.com/TuneGraph/TuneGraph)

A full-stack web application to showcase users Spotify listining history & generate sharable ID cards. More improvements are coming...

### Tech Stack

Built with React + TypeScript + ExpressJS + Vite.


### Quick Start

Clone this repo to your local and run:

```bash
$ npm install
```

### Development

To run dev servers concurrently:
```bash
npm run dev:all
```

Or run them separately:
```bash
# Frontend only (port 5173)
npm run dev

# Backend only (port 3001)
npm run dev:server
```

### Building

Build the frontend:
```bash
npm run build
```

### Project Structure

```bash
tunegraph-iteration/
├── client/
├── server/
├── shared/
├── .gitignore
├── package.json
└── README.md
```

- `/clien` - React frontend code
- `/server` - Express backend code
- `/shared` - Shared files, types&configs

### API

The Express server runs on port 3001 and provides API endpoints. The Vite dev server proxies `/api/*` requests to the Express backend.

### React + TypeScript + Vite

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

### What we've done so far

- Monorepo
  + Restructred dir structure
  + Updated dependencies
  + Applied SoC
  + Updated README & LICENSE

- Fronted
  + Optimezed frontent for Responsive desing
  + Added filter feature for Mobile&Tablet users
  + Added bar graph feature to showcase artist popularity
  + Developed unit testing for React components & features
  + Desinged new login card
  + Designed Share button for sharable sser track ID card

- Backend
  + Developed new API controller getUserProfile
  + Developed unit testing for Controllers
  + Improved code moduleratiy by dividing systems into distinc sections. Model-View-Controller (MVC) & Single Responsibility Principle (SRP) see more at [SoC](https://en.wikipedia.org/wiki/Separation_of_concerns)
# Soccer Doodle

Soccer Doodle is a simple browser-based 5v5 soccer simulation where both teams are controlled by AI models. The project includes a minimal Node.js server, game logic written in JavaScript and HTML5 canvas, and scripts to train lightweight models for different player roles.

## Features

- **AI Controlled Teams** – Each team has five players (goalkeeper, defenders, midfielder and forward). Their behaviour is driven by logistic regression models stored in the `models/` directory.
- **Training Script** – `train.js` generates synthetic training data and saves JSON models for each role. Models are saved under `models/team1` and `models/team2`.
- **Static Web Server** – `server.js` serves `index.html` and the asset files so the game can be run locally.
- **Game Controls** – Reset the match or pause/resume play directly in the browser. A speed slider lets you adjust the simulation speed.
- **Scoreboard** – Live score display for both teams.
- **Testing and Linting** – Jest tests and ESLint configuration are included (run via `npm test` and `npm run lint`).

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Train AI models** (optional – pre-generated models already exist)
   ```bash
   npm run train
   ```
3. **Start the server**
   ```bash
   npm start
   ```
   Then open [http://localhost:3000](http://localhost:3000) in your browser to play.
4. **Run tests** (optional)
   ```bash
   npm test
   ```
5. **Lint the code** (optional)
   ```bash
   npm run lint
   ```


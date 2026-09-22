# Shikaku Puzzle

A full-stack implementation of the Japanese logic puzzle Shikaku. Players divide a grid into rectangles such that each rectangle contains exactly one numbered clue, with the area of the rectangle matching that number.

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Real-time:** Socket.io
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript

---

## Features

- **Procedural Board Generation:** Dynamically generates solvable puzzles of configurable sizes (e.g., 4x4 up to 12x12).
- **Interactive Gameplay:** Click two opposite corners to form a rectangle, with visual indicators and live dimension calculations.
- **Rule Validation:** Enforces Shikaku constraints:
  - Exactly one clue per rectangle.
  - Rectangle area must match the clue value.
  - No overlapping rectangles.
  - Bounds checking within grid dimensions.
- **Instant Removal:** Click on any placed rectangle to delete it.
- **Timer and Win Condition:** Tracks completion time and notifies players upon successfully solving the puzzle.
- **WebSocket Synchronization:** Board actions (placing, removing, reset) are broadcast via Socket.io.

---

## Project Structure

```text
shikaku-puzzle/
├── public/
│   ├── index.html          # Clean, semantic UI with Tailwind CSS
│   └── game.js             # Client-side game logic and Socket.io handlers
├── src/
│   ├── config/
│   │   └── database.js     # MongoDB connection setup
│   ├── controllers/
│   │   └── game.controller.js  # Request handlers for game actions
│   ├── middleware/
│   │   ├── errorHandler.js # Global error handler
│   │   └── logger.js       # Request logging middleware
│   ├── models/
│   │   └── Game.js         # Mongoose schema for board state and rectangles
│   ├── routes/
│   │   └── game.routes.js  # REST API route definitions
│   ├── services/
│   │   └── game.service.js # Core game rules, validation, and board generation
│   └── socket/
│       └── gameSocket.js   # Socket.io room management and event handlers
├── server.js               # Application entry point and HTTP/Socket server
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- MongoDB instance (local or MongoDB Atlas cluster)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AjayMaruda/shikaku-puzzle.git
   cd shikaku-puzzle
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory:

   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/shikaku
   ```

   _(For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string)._

4. Run the application:

   ```bash
   # Production / standard start
   npm start

   # Development mode (with auto-reload)
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

| Method | Endpoint                                           | Description                                    |
| ------ | -------------------------------------------------- | ---------------------------------------------- |
| POST   | `/api/game/board`                                  | Initializes a new board with generated clues   |
| POST   | `/api/game/board/:boardId/place`                   | Validates and places a rectangle               |
| DELETE | `/api/game/board/:boardId/rectangles/:rectangleId` | Removes a placed rectangle                     |
| GET    | `/api/game/board/:boardId/check`                   | Checks whether the puzzle is completely solved |
| POST   | `/api/game/board/:boardId/reset`                   | Resets the puzzle board with a new game        |

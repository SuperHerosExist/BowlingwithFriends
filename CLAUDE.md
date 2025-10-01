# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multiplayer bowling prediction game called "Make or Miss". Players take turns predicting whether a bowler will make or miss their shot. The game uses Firebase Realtime Database for real-time multiplayer synchronization, allowing players to join games using shared game codes.

## Commands

**Development:**
- `npm run dev` - Start the Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Tech Stack

- **Framework:** React 18 with Vite
- **UI Styling:** TailwindCSS (via CDN in index.html)
- **Icons:** lucide-react
- **Backend:** Firebase Realtime Database
- **State Management:** React hooks (useState, useEffect)

## Architecture

### Core Components

The application is structured as a single-page app with one main component:

**BowlingPredictor** (`src/app.jsx`):
- Main game component that handles all game logic and UI states
- Contains three primary UI states:
  1. Lobby screen (create/join game)
  2. Pre-game setup (adding players)
  3. Active game play (making predictions, tracking scores)

### Firebase Integration

**Real-time Synchronization** (`src/firebase.js`):
- Firebase configuration exports a `database` instance
- Game state stored at path: `games/{gameCode}`
- All game updates use `set()` to replace entire game state
- Changes are synchronized in real-time via `onValue()` listener

**Game State Structure:**
```javascript
{
  players: [{ id, name, score }],
  currentRound: number,
  activePlayerIndex: number,
  activePlayerChoice: 'make' | 'miss' | null,
  gameStarted: boolean,
  ledger: { "fromId->toId": points },
  createdAt: timestamp
}
```

### Game Logic

**Prediction System:**
- Active player chooses "make" or "miss"
- All other players automatically get opposite prediction
- Points awarded based on correct predictions:
  - Active player wins: +1 point per opponent
  - Opponents win: +1 point each

**Scoring:**
- Points tracked per player
- Ledger tracks debts between players using key format: `fromId->toId`
- Each point equals $0.25 (configurable via QUARTER constant)
- Game runs for exactly 50 rounds

**State Management:**
- Game code is 6-character alphanumeric (uppercase)
- Host creates game, others join via code
- All players see synchronized real-time updates
- Leaving game returns to lobby

### Key Functions

- `updateGame(updates)` - Central function to sync state to Firebase
- `netPointsFor(playerId)` - Calculates net wins/losses for a player
- `recordResult(result)` - Processes shot result and updates scores/ledger
- `generateGameCode()` - Creates random 6-character game code

## Important Notes

- Firebase API key is exposed in client code (public configuration)
- Component uses direct Firebase writes; no backend validation
- Case sensitivity: `App` in import (line 3 of main.jsx) must match filename case
- TailwindCSS is loaded via CDN, not as npm dependency
- No test suite currently exists
- Game state persists in Firebase until manually deleted
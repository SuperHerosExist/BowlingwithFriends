# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Bowling with Friends" is a multiplayer bowling games platform featuring four distinct game modes. The application uses Firebase Realtime Database for real-time multiplayer synchronization, allowing players to join games using shared game codes and QR codes.

## Commands

**Development:**
- `npm run dev` - Start the Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Tech Stack

- **Framework:** React 18 with Vite
- **UI Styling:** TailwindCSS (via CDN) + custom CSS ([theme.css](src/theme.css), [index.css](src/index.css))
- **Icons:** lucide-react
- **QR Codes:** qrcode.react
- **Backend:** Firebase Realtime Database
- **State Management:** React hooks (useState, useEffect)

## Architecture

### Application Structure

The application uses a landing page with four available game modes:

**GamesLanding** ([src/GamesLanding.jsx](src/GamesLanding.jsx)):
- Main landing page with animated background and game selection
- Displays four game mode cards with gradients and hover effects
- Handles navigation between landing page and individual games
- Provides "Back to Games" button when in a game

### Game Modes

All four games share similar architecture patterns with Firebase sync and QR code support:

1. **Makes or Misses** ([src/games/MakesorMisses.jsx](src/games/MakesorMisses.jsx))
   - Prediction-based game where players guess if bowler makes/misses
   - Active player chooses prediction, others get opposite
   - 50-round format with point tracking and debt ledger
   - Database path: `games/{gameCode}`

2. **Match Play** ([src/games/MatchPlay.jsx](src/games/MatchPlay.jsx))
   - Head-to-head 1v1 3-game match format
   - Stakes-based wagering (per game and totals)
   - Score entry for each game and automatic winner calculation
   - Database path: `matchplay/{gameCode}`

3. **King of the Hill** ([src/games/KingOfTheHill.jsx](src/games/KingOfTheHill.jsx))
   - Multiplayer format with entry fees
   - Prizes for high game and high total pins
   - 3-game series with score tracking
   - Database path: `kingofthehill/{gameCode}`

4. **Bracket Play** ([src/games/BracketPlay.jsx](src/games/BracketPlay.jsx))
   - 8-player single elimination tournament
   - Quarterfinals → Semifinals → Finals structure
   - Prize distribution (1st and 2nd place)
   - Database path: `bracketplay/{gameCode}`

### Firebase Integration

**Configuration** ([src/firebase.js](src/firebase.js)):
- Exports initialized `database` instance
- Firebase Realtime Database: `https://bowling-fun-default-rtdb.firebaseio.com`

**Common Patterns:**
- Each game mode uses separate database path
- All games use `set()` to replace entire game state
- Real-time sync via `onValue()` listener
- Game codes are 6-character alphanumeric (uppercase)
- QR code generation for easy mobile joining via URL params

### Shared Features Across Games

**Lobby System:**
- Create game (generates code) or join via code entry
- URL parameter support: `?join={gameCode}` for direct joining
- QR code display with `QRCodeSVG` component
- Firebase existence check before joining

**State Management Pattern:**
- `gameCode` - Current game identifier
- `joinCode` - User input for joining
- `isHost` - Whether user created the game
- `inGame` - Whether user is in active game session
- `showQR` - Toggle for QR code display
- `gameStarted` - Whether gameplay has begun

**Common Functions:**
- `generateGameCode()` - Creates random 6-char uppercase code
- `createGame()` - Initializes Firebase game state
- `joinGame()` - Validates and joins existing game
- `updateGame(updates)` - Syncs state to Firebase
- `leaveGame()` - Returns to lobby
- `getJoinURL()` - Builds shareable URL with game code

### UI Theme System

**Custom CSS:**
- Dark theme with gradient backgrounds ([theme.css](src/theme.css))
- Reusable game card, button, and input styles
- Animated backgrounds with grid overlays and gradient orbs
- Responsive design for mobile and desktop

**Design System:**
- Color-coded game modes (cyan, emerald, amber, violet gradients)
- Glassmorphism effects with backdrop blur
- Shadow effects with color-matched glows
- Consistent button and input styling across all games

## Important Notes

- Firebase API key is exposed in client code (standard practice for client-side Firebase)
- No backend validation - all game logic runs client-side
- TailwindCSS loaded via CDN (not npm dependency)
- No test suite exists
- Game state persists in Firebase indefinitely
- Entry point: [src/main.jsx](src/main.jsx) renders `GamesLanding`
- All games support real-time multiplayer with QR code sharing
- Mobile-responsive with touch-friendly controls
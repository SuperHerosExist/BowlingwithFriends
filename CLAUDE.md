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

### Authentication & User Management

**Authentication System** ([src/AuthContext.jsx](src/AuthContext.jsx)):
- Firebase Authentication with Google and Apple sign-in providers
- Anonymous/Guest mode support for playing without account
- Persistent authentication state across sessions
- Automatic user profile initialization in database

**User Profile Structure:**
```javascript
users/{uid}: {
  uid: string,
  displayName: string,
  email: string | null,
  photoURL: string | null,
  isAnonymous: boolean,
  createdAt: timestamp,
  lastLogin: timestamp,
  stats: {
    makesOrMisses: { gamesPlayed, totalPoints, wins, losses },
    matchPlay: { gamesPlayed, wins, losses, ties },
    kingOfTheHill: { gamesPlayed, highGameWins, highTotalWins },
    bracketPlay: { tournamentsPlayed, championships, runnerUps }
  }
}
```

**Components:**
- **AuthModal** ([src/components/AuthModal.jsx](src/components/AuthModal.jsx)) - Sign in dialog with Google/Apple/Guest options
- **UserStats** ([src/components/UserStats.jsx](src/components/UserStats.jsx)) - Stats dashboard showing performance across all games
- **useGameStats** ([src/hooks/useGameStats.js](src/hooks/useGameStats.js)) - Hook for recording game statistics

**User Experience:**
- Guest users can play all games but stats won't persist across devices
- Authenticated users have stats tracked automatically
- Profile button in top-right corner shows user menu
- "View Stats" modal displays detailed performance metrics
- Sign out returns to unauthenticated state

**Stats Tracking:**
- Makes or Misses: Tracks games played, total points, wins/losses
- Match Play: Records match outcomes (win/loss/tie)
- King of the Hill: Counts high game and high total victories
- Bracket Play: Tracks tournament participation and placements
- Stats automatically update when games complete

### Admin Dashboard

**Admin System** ([src/adminConfig.js](src/adminConfig.js)):
- Email-based admin authorization
- Configure admin users by adding emails to `ADMIN_EMAILS` array
- Role-based access control via `isAdmin()` function

**AdminDashboard Component** ([src/components/AdminDashboard.jsx](src/components/AdminDashboard.jsx)):
- Real-time system overview and management
- Three main views: Overview, Users, Active Games
- Accessible only to authorized admin users

**Dashboard Features:**
- **Overview Tab:**
  - Total users, authenticated vs guest breakdown
  - Total active games count
  - Game mode distribution (Makes or Misses, Match Play, etc.)
- **Users Tab:**
  - Complete user list with profiles
  - User type (Guest/Authenticated)
  - Join dates and total games played
  - Sortable and filterable table view
- **Active Games Tab:**
  - All active games across all game modes
  - Game codes, player counts, creation timestamps
  - Organized by game type with color coding

**Access Control:**
- Admin menu option appears in user dropdown for authorized users
- Non-admin users see "Access Denied" if attempting direct access
- Admin status checked via email match in `adminConfig.js`

**Setup Instructions:**
1. Open [src/adminConfig.js](src/adminConfig.js)
2. Add your email(s) to `ADMIN_EMAILS` array
3. Sign in with that email using Google or Email/Password auth
4. Admin Dashboard option appears in user menu

## Important Notes

- Firebase API key is exposed in client code (standard practice for client-side Firebase)
- Firebase Authentication enabled for Google and Email/Password providers
- Guest/anonymous authentication supported
- Admin access controlled via email whitelist in `adminConfig.js`
- No backend validation - all game logic runs client-side
- TailwindCSS loaded via CDN (not npm dependency)
- No test suite exists
- Game state persists in Firebase indefinitely
- User stats persist for authenticated users only
- Entry point: [src/main.jsx](src/main.jsx) wraps app with `AuthProvider`
- All games support real-time multiplayer with QR code sharing
- Mobile-responsive with touch-friendly controls
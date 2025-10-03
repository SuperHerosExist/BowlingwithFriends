import React, { useState, useEffect } from 'react';
import { UserPlus, QrCode, Trophy, Zap, DollarSign, X as XIcon, HelpCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { database } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';
import { useAuth } from '../AuthContext';
import { isAdmin } from '../adminConfig';

export default function MysteryFrames() {
  const { currentUser } = useAuth();
  const isUserAdmin = currentUser && isAdmin(currentUser.email);
  const isGuest = currentUser?.isAnonymous;

  const [gameCode, setGameCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Game state
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);

  // Quarters game (.25 one-tie-all-tie)
  const [framePots, setFramePots] = useState({}); // { 1: 0.75, 2: 1.50, etc }
  const [frameWinners, setFrameWinners] = useState({}); // { 1: [playerId], 2: [], etc }
  const [frameScores, setFrameScores] = useState({}); // { 1: {playerId: score}, 2: {}, etc }

  // Mystery Frames (bonus pots)
  const [mysteryPots, setMysteryPots] = useState([]); // [{id, startFrame, amount, activePlayers[], winner}]
  const [showMysterySection, setShowMysterySection] = useState(false);
  const [customMysteryAmount, setCustomMysteryAmount] = useState(1);

  const QUARTER = 0.25;
  const toMoney = (amount) => amount.toFixed(2);

  const getJoinURL = () => {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?join=${gameCode}&game=mystery-frames`;
  };

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Check URL for join code on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get('join');
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
    }
  }, []);

  // Firebase sync
  useEffect(() => {
    if (!gameCode) return;

    const gameRef = ref(database, `mysteryframes/${gameCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        setGameStarted(data.gameStarted || false);
        setCurrentFrame(data.currentFrame || 1);
        setFramePots(data.framePots || {});
        setFrameWinners(data.frameWinners || {});
        setFrameScores(data.frameScores || {});
        setMysteryPots(data.mysteryPots || []);
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  const toProperCase = (str) => {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const createGame = () => {
    if (isGuest) {
      alert('Please sign in to play Mystery Frames. This game requires authentication.');
      return;
    }

    const code = generateGameCode();
    setGameCode(code);
    setIsHost(true);
    setInGame(true);

    // Auto-add creator as first player
    const creatorName = currentUser?.displayName || 'Player';
    const initialPlayers = [{
      id: Date.now(),
      name: toProperCase(creatorName),
      uid: currentUser?.uid,
      totalWinnings: 0
    }];

    const gameRef = ref(database, `mysteryframes/${code}`);
    set(gameRef, {
      players: initialPlayers,
      gameStarted: false,
      currentFrame: 1,
      framePots: {},
      frameWinners: {},
      frameScores: {},
      mysteryPots: [],
      createdAt: Date.now()
    });
  };

  const joinGame = async () => {
    if (!joinCode.trim()) return;

    if (isGuest) {
      alert('Please sign in to play Mystery Frames. This game requires authentication.');
      return;
    }

    const code = joinCode.toUpperCase();
    const gameRef = ref(database, `mysteryframes/${code}`);
    const snapshot = await get(gameRef);

    if (snapshot.exists()) {
      setGameCode(code);
      setIsHost(false);
      setInGame(true);

      // Auto-add joiner as a player if not already in the game
      const gameData = snapshot.val();
      const existingPlayer = gameData.players?.find(p => p.uid === currentUser?.uid);

      if (!existingPlayer && !gameData.gameStarted) {
        const joinerName = currentUser?.displayName || 'Player';
        const updatedPlayers = [...(gameData.players || []), {
          id: Date.now(),
          name: toProperCase(joinerName),
          uid: currentUser?.uid,
          totalWinnings: 0
        }];
        await set(gameRef, { ...gameData, players: updatedPlayers });
      }
    } else {
      alert('Game not found! Check the code and try again.');
    }
  };

  const updateGame = async (updates) => {
    if (!gameCode) return;
    try {
      const gameRef = ref(database, `mysteryframes/${gameCode}`);
      const snapshot = await get(gameRef);
      const currentData = snapshot.val();
      await set(gameRef, { ...currentData, ...updates });
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && !gameStarted) {
      const newPlayers = [...players, {
        id: Date.now(),
        name: toProperCase(newPlayerName.trim()),
        uid: null, // Manually added players don't have a UID
        totalWinnings: 0
      }];
      updateGame({ players: newPlayers });
      setNewPlayerName('');
    }
  };

  const startGame = () => {
    if (players.length < 2) return;

    // Initialize frame 1 pot
    const initialPot = players.length * QUARTER;
    updateGame({
      gameStarted: true,
      currentFrame: 1,
      framePots: { 1: initialPot },
      frameScores: { 1: {} },
      frameWinners: { 1: [] }
    });
  };

  const setPlayerScore = (playerId, score) => {
    // Check if user can edit this score
    const player = players.find(p => p.id === playerId);
    const canEdit = isUserAdmin || player?.uid === currentUser?.uid;

    if (!canEdit) {
      alert('You can only enter your own scores.');
      return;
    }

    const newFrameScores = {
      ...frameScores,
      [currentFrame]: {
        ...frameScores[currentFrame],
        [playerId]: parseInt(score) || 0
      }
    };

    updateGame({ frameScores: newFrameScores });
  };

  const calculateFrameWinners = () => {
    const scores = frameScores[currentFrame] || {};
    const scoreEntries = Object.entries(scores);

    if (scoreEntries.length !== players.length) {
      alert('Please enter scores for all players first!');
      return;
    }

    const maxScore = Math.max(...Object.values(scores));
    const winnerIds = scoreEntries
      .filter(([_, score]) => score === maxScore)
      .map(([playerId]) => parseInt(playerId));

    return winnerIds;
  };

  const advanceFrame = () => {
    const winnerIds = calculateFrameWinners();
    if (!winnerIds) return;

    const currentPot = framePots[currentFrame] || 0;
    const isTie = winnerIds.length > 1;

    let updatedPlayers = [...players];
    let updatedWinners = { ...frameWinners, [currentFrame]: winnerIds };
    let updatedPots = { ...framePots };

    if (!isTie && winnerIds.length === 1) {
      // Single winner - award pot
      const winnerId = winnerIds[0];
      updatedPlayers = players.map(p =>
        p.id === winnerId
          ? { ...p, totalWinnings: (p.totalWinnings || 0) + currentPot }
          : p
      );
    }

    // Process mystery frames for strikes
    const updatedMysteryPots = mysteryPots.map(pot => {
      if (pot.winner) return pot;

      // Check who struck (scored 10) in this frame
      const scores = frameScores[currentFrame] || {};
      const newActivePlayers = pot.activePlayers.filter(playerId => {
        const score = scores[playerId];
        return score === 10 || parseInt(score) === 10; // Must strike to stay in
      });

      // If only one player left who struck, they win the pot
      if (newActivePlayers.length === 1) {
        const winnerId = newActivePlayers[0];
        updatedPlayers = updatedPlayers.map(p =>
          p.id === winnerId
            ? { ...p, totalWinnings: (p.totalWinnings || 0) + pot.amount }
            : p
        );
        return { ...pot, activePlayers: newActivePlayers, winner: winnerId };
      }

      // If no one struck, pot carries to next frame - keep all original players active
      // The pot must be won, so everyone gets another chance
      if (newActivePlayers.length === 0) {
        return pot; // No changes - all players stay in, pot carries over
      }

      // If multiple struck, only they continue competing in the next frame
      return { ...pot, activePlayers: newActivePlayers };
    });

    // Prepare next frame
    const nextFrame = currentFrame + 1;
    const nextPot = isTie
      ? currentPot + (players.length * QUARTER) // Pot rolls over + new quarter from each
      : players.length * QUARTER; // New pot starts

    updatedPots[nextFrame] = nextPot;

    updateGame({
      players: updatedPlayers,
      currentFrame: nextFrame,
      frameWinners: updatedWinners,
      framePots: updatedPots,
      frameScores: { ...frameScores, [nextFrame]: {} },
      mysteryPots: updatedMysteryPots
    });
  };

  const startMysteryPot = (amount) => {
    const newPot = {
      id: Date.now(),
      startFrame: currentFrame,
      amount: amount,
      activePlayers: players.map(p => p.id),
      winner: null
    };
    updateGame({ mysteryPots: [...mysteryPots, newPot] });
  };

  const leaveGame = () => {
    setInGame(false);
    setGameCode('');
    setJoinCode('');
    setIsHost(false);
  };

  if (!inGame) {
    return (
      <div className="game-container">
        <div className="game-background"></div>
        <div className="game-grid-overlay"></div>
        <div className="game-orb" style={{ top: '25%', left: '25%', backgroundColor: 'rgb(217, 119, 6)' }}></div>

        <div className="game-content flex items-center justify-center">
          <div className="max-w-md w-full game-card">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, rgb(251, 191, 36), rgb(217, 119, 6))' }}>
                <Zap size={28} style={{ color: 'rgb(255, 255, 255)' }} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold" style={{ background: 'linear-gradient(to right, rgb(251, 191, 36), rgb(217, 119, 6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Mystery Frames
              </h1>
            </div>
            <p className="text-center mb-8 text-sm sm:text-base" style={{ color: 'rgb(148, 163, 184)' }}>Quarters Game with Mystery Frame Bonuses</p>

            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-lg transition"
                style={{ backgroundColor: 'rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(180, 83, 9)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(217, 119, 6)'}
              >
                <Zap size={20} />
                Create New Game
              </button>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ backgroundColor: 'rgb(71, 85, 105)' }}></div>
                <span className="text-sm" style={{ color: 'rgb(148, 163, 184)' }}>or</span>
                <div className="h-px flex-1" style={{ backgroundColor: 'rgb(71, 85, 105)' }}></div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter Game Code"
                  className="w-full text-center text-lg font-mono py-3 px-4 rounded-lg"
                  style={{ backgroundColor: 'rgb(30, 41, 59)', border: '1px solid rgb(71, 85, 105)', color: 'rgb(255, 255, 255)' }}
                  maxLength={6}
                />
                <button
                  onClick={joinGame}
                  className="w-full py-3 rounded-lg font-bold text-lg transition"
                  style={{ backgroundColor: 'rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(180, 83, 9)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(217, 119, 6)'}
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPot = framePots[currentFrame] || 0;
  const currentScores = frameScores[currentFrame] || {};
  const allScoresEntered = players.every(p => currentScores[p.id] !== undefined);

  return (
    <div className="game-container">
      <div className="game-background"></div>
      <div className="game-grid-overlay"></div>
      <div className="game-orb" style={{ top: '20%', right: '20%', backgroundColor: 'rgb(217, 119, 6)' }}></div>

      <div className="game-content">
        <div className="game-max-width">
          <div className="game-card relative">
          {/* Help Button - Top Right */}
          <button
            onClick={() => setShowHelp(true)}
            className="absolute top-4 right-4 p-2 rounded-lg transition z-10"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgb(217, 119, 6)', color: 'rgb(251, 191, 36)' }}
            title="How to play"
          >
            <HelpCircle size={20} />
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, rgb(251, 191, 36), rgb(217, 119, 6))' }}>
                <Zap size={24} style={{ color: 'rgb(255, 255, 255)' }} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ background: 'linear-gradient(to right, rgb(251, 191, 36), rgb(217, 119, 6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Mystery Frames
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgb(71, 85, 105)' }}>
                <span className="text-xs sm:text-sm" style={{ color: 'rgb(148, 163, 184)' }}>Code:</span>
                <span className="font-mono font-bold text-sm sm:text-lg ml-2" style={{ color: 'rgb(255, 255, 255)' }}>{gameCode}</span>
              </div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="p-2 rounded-lg transition"
                style={{ backgroundColor: 'rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                title="Show QR code"
              >
                <QrCode size={20} />
              </button>
            </div>
          </div>

          {/* Help Modal */}
          {showHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
              <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}></div>
              <div className="relative rounded-xl max-w-md w-full p-6" style={{ background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))', border: '2px solid rgb(251, 191, 36)' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-1 rounded-lg transition"
                  style={{ backgroundColor: 'rgba(71, 85, 105, 0.5)', color: 'rgb(148, 163, 184)' }}
                >
                  <XIcon size={20} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, rgb(251, 191, 36), rgb(217, 119, 6))' }}>
                    <Zap size={24} style={{ color: 'rgb(255, 255, 255)' }} />
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: 'rgb(251, 191, 36)' }}>How to Play</h2>
                </div>

                <div className="space-y-4" style={{ color: 'rgb(203, 213, 225)' }}>
                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'rgb(251, 191, 36)' }}>🎯 Quarters Game</h3>
                    <p className="text-sm">Everyone puts in $0.25 per frame. Highest score wins the pot! Ties roll over to next frame.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'rgb(251, 191, 36)' }}>⚡ Mystery Frames</h3>
                    <p className="text-sm">Start bonus pots ($1-$5 or custom). Strike (X) to stay in! Last striker standing wins the mystery pot.</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1" style={{ color: 'rgb(251, 191, 36)' }}>📱 Quick Tips</h3>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Tap 7, 8, 9, or X to enter scores</li>
                      <li>Mystery pots carry over until won</li>
                      <li>Multiple mystery frames can run simultaneously</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-6 py-3 rounded-lg font-bold transition"
                  style={{ background: 'linear-gradient(to right, rgb(251, 191, 36), rgb(217, 119, 6))', color: 'rgb(255, 255, 255)' }}
                >
                  Got it!
                </button>
              </div>
            </div>
          )}

          {showQR && (
            <div className="mb-6 p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
              <div className="inline-block p-4 rounded-lg" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
                <QRCodeSVG value={getJoinURL()} size={200} />
              </div>
              <p className="mt-3 text-sm" style={{ color: 'rgb(148, 163, 184)' }}>
                Scan to join game <span className="font-mono font-bold" style={{ color: 'rgb(255, 255, 255)' }}>{gameCode}</span>
              </p>
            </div>
          )}

          {!gameStarted ? (
            <div className="space-y-6">
              <p className="text-center text-lg" style={{ color: 'rgb(251, 191, 36)' }}>
                Share code <span className="font-mono font-bold text-xl" style={{ color: 'rgb(255, 255, 255)' }}>{gameCode}</span> with friends or show them the QR code!
              </p>

              <div className="space-y-4">
                <h3 className="font-bold text-lg" style={{ color: 'rgb(255, 255, 255)' }}>Players ({players.length})</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    placeholder="Enter Player's Name"
                    className="flex-1 px-4 py-2 rounded-lg"
                    style={{ backgroundColor: 'rgb(30, 41, 59)', border: '1px solid rgb(71, 85, 105)', color: 'rgb(255, 255, 255)' }}
                  />
                  <button
                    onClick={addPlayer}
                    className="px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                    style={{ backgroundColor: 'rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                  >
                    <UserPlus size={20} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

                {players.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="px-4 py-2 rounded-lg font-semibold text-center"
                        style={{ backgroundColor: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                      >
                        {player.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={startGame}
                disabled={players.length < 2}
                className="w-full py-4 rounded-lg font-bold text-xl transition"
                style={{
                  backgroundColor: players.length < 2 ? 'rgb(71, 85, 105)' : 'rgb(34, 197, 94)',
                  color: 'rgb(255, 255, 255)',
                  opacity: players.length < 2 ? 0.5 : 1,
                  cursor: players.length < 2 ? 'not-allowed' : 'pointer'
                }}
              >
                {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Frame Info */}
              <div className="rounded-lg p-6 text-center" style={{ background: 'linear-gradient(to right, rgba(217, 119, 6, 0.2), rgba(180, 83, 9, 0.2))', border: '2px solid rgb(251, 191, 36)' }}>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'rgb(255, 255, 255)' }}>Frame {currentFrame}</h2>
                <div className="flex items-center justify-center gap-3 text-2xl">
                  <DollarSign size={32} style={{ color: 'rgb(34, 197, 94)' }} />
                  <span className="font-bold" style={{ color: 'rgb(34, 197, 94)' }}>${toMoney(currentPot)}</span>
                </div>
                <p className="text-sm mt-2" style={{ color: 'rgb(148, 163, 184)' }}>Current Pot (.25 per player{currentPot > players.length * QUARTER ? ' + rollover' : ''})</p>
              </div>

              {/* Score Entry */}
              <div className="rounded-lg p-4 sm:p-6" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgb(71, 85, 105)' }}>
                <h3 className="font-bold text-lg mb-4" style={{ color: 'rgb(255, 255, 255)' }}>Enter Scores (0-10)</h3>
                <div className="space-y-4">
                  {players.map((player) => (
                    <div key={player.id} className="rounded-lg p-3 sm:p-4" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgb(71, 85, 105)' }}>
                      <label className="block text-sm font-semibold mb-3" style={{ color: 'rgb(148, 163, 184)' }}>
                        {player.name}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => setPlayerScore(player.id, 7)}
                          className="py-3 rounded-lg font-bold text-xl transition"
                          style={{
                            backgroundColor: currentScores[player.id] === 7 ? 'rgb(217, 119, 6)' : 'rgba(30, 41, 59, 0.5)',
                            border: '2px solid ' + (currentScores[player.id] === 7 ? 'rgb(251, 191, 36)' : 'rgb(71, 85, 105)'),
                            color: 'rgb(255, 255, 255)'
                          }}
                        >
                          7
                        </button>
                        <button
                          onClick={() => setPlayerScore(player.id, 8)}
                          className="py-3 rounded-lg font-bold text-xl transition"
                          style={{
                            backgroundColor: currentScores[player.id] === 8 ? 'rgb(217, 119, 6)' : 'rgba(30, 41, 59, 0.5)',
                            border: '2px solid ' + (currentScores[player.id] === 8 ? 'rgb(251, 191, 36)' : 'rgb(71, 85, 105)'),
                            color: 'rgb(255, 255, 255)'
                          }}
                        >
                          8
                        </button>
                        <button
                          onClick={() => setPlayerScore(player.id, 9)}
                          className="py-3 rounded-lg font-bold text-xl transition"
                          style={{
                            backgroundColor: currentScores[player.id] === 9 ? 'rgb(217, 119, 6)' : 'rgba(30, 41, 59, 0.5)',
                            border: '2px solid ' + (currentScores[player.id] === 9 ? 'rgb(251, 191, 36)' : 'rgb(71, 85, 105)'),
                            color: 'rgb(255, 255, 255)'
                          }}
                        >
                          9
                        </button>
                        <button
                          onClick={() => setPlayerScore(player.id, 10)}
                          className="py-3 rounded-lg font-bold text-xl transition"
                          style={{
                            backgroundColor: currentScores[player.id] === 10 ? 'rgb(34, 197, 94)' : 'rgba(30, 41, 59, 0.5)',
                            border: '2px solid ' + (currentScores[player.id] === 10 ? 'rgb(34, 197, 94)' : 'rgb(71, 85, 105)'),
                            color: 'rgb(255, 255, 255)'
                          }}
                        >
                          X
                        </button>
                      </div>
                      {currentScores[player.id] === 10 && (
                        <p className="text-xs mt-2 text-center font-bold" style={{ color: 'rgb(34, 197, 94)' }}>⚡ STRIKE!</p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={advanceFrame}
                  disabled={!allScoresEntered}
                  className="w-full mt-6 py-3 rounded-lg font-bold text-lg transition"
                  style={{
                    backgroundColor: allScoresEntered ? 'rgb(34, 197, 94)' : 'rgb(71, 85, 105)',
                    color: 'rgb(255, 255, 255)',
                    opacity: allScoresEntered ? 1 : 0.5,
                    cursor: allScoresEntered ? 'pointer' : 'not-allowed'
                  }}
                >
                  {allScoresEntered ? 'Next Frame' : 'Enter All Scores First'}
                </button>
              </div>

              {/* Mystery Frames Section */}
              <div className="rounded-lg border-2 p-4" style={{ borderColor: 'rgb(251, 191, 36)', background: 'linear-gradient(to bottom right, rgba(217, 119, 6, 0.1), rgba(180, 83, 9, 0.1))' }}>
                <button
                  onClick={() => setShowMysterySection(!showMysterySection)}
                  className="w-full flex items-center justify-between p-3 rounded-lg transition"
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', color: 'rgb(255, 255, 255)' }}
                >
                  <div className="flex items-center gap-3">
                    <Zap size={24} style={{ color: 'rgb(251, 191, 36)' }} />
                    <span className="font-bold text-lg">Mystery Frame Bonuses ({mysteryPots.filter(p => !p.winner && p.activePlayers.length > 0).length} active)</span>
                  </div>
                  <span>{showMysterySection ? '▼' : '▶'}</span>
                </button>

                {showMysterySection && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                      <h4 className="font-bold mb-3" style={{ color: 'rgb(255, 255, 255)' }}>Start New Mystery Frame</h4>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(amount => (
                          <button
                            key={amount}
                            onClick={() => startMysteryPot(amount)}
                            className="py-2 rounded-lg font-bold transition"
                            style={{ backgroundColor: 'rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(180, 83, 9)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(217, 119, 6)'}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                      <div className="pt-3" style={{ borderTop: '1px solid rgb(71, 85, 105)' }}>
                        <p className="text-xs mb-2" style={{ color: 'rgb(148, 163, 184)' }}>Custom Amount</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCustomMysteryAmount(Math.max(0.5, customMysteryAmount - 0.5))}
                            className="px-4 py-2 rounded-lg font-bold transition"
                            style={{ backgroundColor: 'rgb(71, 85, 105)', color: 'rgb(255, 255, 255)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(100, 116, 139)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(71, 85, 105)'}
                          >
                            −
                          </button>
                          <div className="flex-1 text-center py-2 rounded-lg font-bold text-lg" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgb(71, 85, 105)', color: 'rgb(255, 255, 255)' }}>
                            ${customMysteryAmount.toFixed(2)}
                          </div>
                          <button
                            onClick={() => setCustomMysteryAmount(customMysteryAmount + 0.5)}
                            className="px-4 py-2 rounded-lg font-bold transition"
                            style={{ backgroundColor: 'rgb(71, 85, 105)', color: 'rgb(255, 255, 255)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(100, 116, 139)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(71, 85, 105)'}
                          >
                            +
                          </button>
                          <button
                            onClick={() => startMysteryPot(customMysteryAmount)}
                            className="px-4 py-2 rounded-lg font-bold transition"
                            style={{ backgroundColor: 'rgb(217, 119, 6)', color: 'rgb(255, 255, 255)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(180, 83, 9)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(217, 119, 6)'}
                          >
                            Start
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {mysteryPots.length === 0 ? (
                        <p className="text-center py-4" style={{ color: 'rgb(148, 163, 184)' }}>No mystery frames started yet</p>
                      ) : (
                        mysteryPots.map(pot => {
                          const isActive = pot.activePlayers.length > 0 && !pot.winner;
                          const winnerPlayer = pot.winner ? players.find(p => p.id === pot.winner) : null;

                          return (
                            <div
                              key={pot.id}
                              className="rounded-lg p-4 border-2"
                              style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                                borderColor: pot.winner ? 'rgb(34, 197, 94)' : isActive ? 'rgb(251, 191, 36)' : 'rgb(100, 116, 139)'
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Zap size={18} style={{ color: 'rgb(251, 191, 36)' }} />
                                    <span className="font-bold" style={{ color: 'rgb(255, 255, 255)' }}>
                                      Started Frame {pot.startFrame} · ${pot.amount}
                                    </span>
                                  </div>
                                  {pot.winner ? (
                                    <p className="text-sm mt-1" style={{ color: 'rgb(34, 197, 94)' }}>
                                      🏆 Winner: {winnerPlayer?.name}
                                    </p>
                                  ) : pot.activePlayers.length === 0 ? (
                                    <p className="text-sm mt-1" style={{ color: 'rgb(148, 163, 184)' }}>
                                      No winner - all missed
                                    </p>
                                  ) : (
                                    <p className="text-sm mt-1" style={{ color: 'rgb(251, 191, 36)' }}>
                                      {pot.activePlayers.length} player(s) still in (must strike to continue)
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="rounded-lg p-6" style={{ background: 'linear-gradient(to right, rgba(30, 41, 59, 0.5), rgba(217, 119, 6, 0.2))', border: '1px solid rgb(71, 85, 105)' }}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'rgb(255, 255, 255)' }}>
                  <Trophy style={{ color: 'rgb(251, 191, 36)' }} size={24} />
                  Total Winnings
                </h3>
                <div className="space-y-2">
                  {[...players].sort((a, b) => (b.totalWinnings || 0) - (a.totalWinnings || 0)).map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center px-4 py-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                    >
                      <span className="font-semibold" style={{ color: 'rgb(255, 255, 255)' }}>
                        {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'} {player.name}
                      </span>
                      <span className="font-bold text-lg" style={{ color: 'rgb(34, 197, 94)' }}>
                        ${toMoney(player.totalWinnings || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debt Ledger */}
              <div className="rounded-lg p-6" style={{ background: 'linear-gradient(to right, rgba(30, 41, 59, 0.5), rgba(217, 119, 6, 0.2))', border: '1px solid rgb(71, 85, 105)' }}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'rgb(255, 255, 255)' }}>
                  <DollarSign style={{ color: 'rgb(251, 191, 36)' }} size={24} />
                  Who Owes Whom
                </h3>
                <div className="space-y-2">
                  {(() => {
                    // Calculate average winnings
                    const totalWinnings = players.reduce((sum, p) => sum + (p.totalWinnings || 0), 0);
                    const avgWinnings = totalWinnings / players.length;

                    // Find creditors (won more than average) and debtors (won less than average)
                    const creditors = players
                      .filter(p => (p.totalWinnings || 0) > avgWinnings)
                      .map(p => ({ ...p, amount: (p.totalWinnings || 0) - avgWinnings }))
                      .sort((a, b) => b.amount - a.amount);

                    const debtors = players
                      .filter(p => (p.totalWinnings || 0) < avgWinnings)
                      .map(p => ({ ...p, amount: avgWinnings - (p.totalWinnings || 0) }))
                      .sort((a, b) => b.amount - a.amount);

                    // If everyone won the same amount
                    if (creditors.length === 0 && debtors.length === 0) {
                      return (
                        <p className="text-center py-4" style={{ color: 'rgb(148, 163, 184)' }}>
                          Everyone's even! No debts to settle.
                        </p>
                      );
                    }

                    // Calculate settlements
                    const settlements = [];
                    const creditorsCopy = creditors.map(c => ({ ...c }));
                    const debtorsCopy = debtors.map(d => ({ ...d }));

                    for (let debtor of debtorsCopy) {
                      let remaining = debtor.amount;

                      for (let creditor of creditorsCopy) {
                        if (remaining <= 0) break;
                        if (creditor.amount <= 0) continue;

                        const payment = Math.min(remaining, creditor.amount);
                        settlements.push({
                          from: debtor.name,
                          to: creditor.name,
                          amount: payment
                        });

                        remaining -= payment;
                        creditor.amount -= payment;
                      }
                    }

                    if (settlements.length === 0) {
                      return (
                        <p className="text-center py-4" style={{ color: 'rgb(148, 163, 184)' }}>
                          Everyone's even! No debts to settle.
                        </p>
                      );
                    }

                    return settlements.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 rounded-lg"
                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: 'rgb(239, 68, 68)' }}>{s.from}</span>
                          <span style={{ color: 'rgb(148, 163, 184)' }}>owes</span>
                          <span className="font-semibold" style={{ color: 'rgb(34, 197, 94)' }}>{s.to}</span>
                        </div>
                        <span className="font-bold text-lg" style={{ color: 'rgb(251, 191, 36)' }}>
                          ${s.amount.toFixed(2)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <button
                onClick={leaveGame}
                className="w-full py-3 rounded-lg font-semibold transition"
                style={{ backgroundColor: 'rgb(71, 85, 105)', color: 'rgb(255, 255, 255)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(100, 116, 139)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(71, 85, 105)'}
              >
                Leave Game
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

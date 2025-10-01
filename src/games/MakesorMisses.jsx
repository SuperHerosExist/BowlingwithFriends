import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Trophy, QrCode, Users, Target } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { database } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';
import { useAuth } from '../AuthContext';
import { useGameStats } from '../hooks/useGameStats';

export default function BowlingPredictor() {
  const { currentUser } = useAuth();
  const { recordMakesOrMissesGame } = useGameStats();
  const [gameCode, setGameCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [activePlayerChoice, setActivePlayerChoice] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [ledger, setLedger] = useState({});

  const QUARTER = 0.25;
  const toMoney = (pts) => (pts * QUARTER).toFixed(2);
  const keyIOweYou = (fromId, toId) => `${fromId}->${toId}`;

  // Generate the join URL for QR code
  const getJoinURL = () => {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?join=${gameCode}`;
  };

  const netPointsFor = (playerId) => {
    let credits = 0;
    let debits = 0;
    Object.entries(ledger).forEach(([k, pts]) => {
      if (!pts) return;
      const [fromId, toId] = k.split('->').map(Number);
      if (toId === playerId) credits += pts;
      if (fromId === playerId) debits += pts;
    });
    return credits - debits;
  };

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Check URL for join code on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get('join');
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!gameCode) return;

    const gameRef = ref(database, `games/${gameCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        setCurrentRound(data.currentRound || 0);
        setActivePlayerIndex(data.activePlayerIndex || 0);
        setActivePlayerChoice(data.activePlayerChoice || null);
        setGameStarted(data.gameStarted || false);
        setLedger(data.ledger || {});
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  const createGame = () => {
    const code = generateGameCode();
    setGameCode(code);
    setIsHost(true);
    setInGame(true);
    
    const gameRef = ref(database, `games/${code}`);
    set(gameRef, {
      players: [],
      currentRound: 0,
      activePlayerIndex: 0,
      activePlayerChoice: null,
      gameStarted: false,
      ledger: {},
      createdAt: Date.now()
    });
  };

  const joinGame = async () => {
    if (!joinCode.trim()) return;
    
    const code = joinCode.toUpperCase();
    const gameRef = ref(database, `games/${code}`);
    const snapshot = await get(gameRef);
    
    if (snapshot.exists()) {
      setGameCode(code);
      setIsHost(false);
      setInGame(true);
    } else {
      alert('Game not found! Check the code and try again.');
    }
  };

  const updateGame = (updates) => {
    if (!gameCode) return;
    const gameRef = ref(database, `games/${gameCode}`);
    set(gameRef, {
      players,
      currentRound,
      activePlayerIndex,
      activePlayerChoice,
      gameStarted,
      ledger,
      ...updates
    });
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && !gameStarted) {
      const newPlayers = [...players, { 
        id: Date.now(), 
        name: newPlayerName.trim(), 
        score: 0 
      }];
      updateGame({ players: newPlayers });
      setNewPlayerName('');
    }
  };

  const startGame = () => {
    if (players.length >= 2) {
      updateGame({
        gameStarted: true,
        currentRound: 1,
        activePlayerIndex: 0,
        activePlayerChoice: null
      });
    }
  };

  const makeChoice = (choice) => {
    updateGame({ activePlayerChoice: choice });
  };

  const recordResult = (result) => {
    const chooser = players[activePlayerIndex];
    const others = players.filter((_, i) => i !== activePlayerIndex);

    const updatedPlayers = players.map((p, i) => {
      if (i === activePlayerIndex) {
        return activePlayerChoice === result
          ? { ...p, score: p.score + (players.length - 1) }
          : p;
      } else {
        const oppositeChoice = activePlayerChoice === 'make' ? 'miss' : 'make';
        return oppositeChoice === result ? { ...p, score: p.score + 1 } : p;
      }
    });

    const newLedger = { ...ledger };
    if (activePlayerChoice === result) {
      others.forEach((opp) => {
        const k = keyIOweYou(opp.id, chooser.id);
        newLedger[k] = (newLedger[k] || 0) + 1;
      });
    } else {
      others.forEach((opp) => {
        const k = keyIOweYou(chooser.id, opp.id);
        newLedger[k] = (newLedger[k] || 0) + 1;
      });
    }

    updateGame({
      players: updatedPlayers,
      ledger: newLedger,
      currentRound: currentRound < 50 ? currentRound + 1 : currentRound,
      activePlayerIndex: currentRound < 50 ? (activePlayerIndex + 1) % players.length : activePlayerIndex,
      activePlayerChoice: null
    });
  };

  const recordGameStats = async () => {
    if (!currentUser || !gameOver) return;

    // Find current user's player data
    const currentPlayerData = players.find(p =>
      p.name.toLowerCase() === currentUser.displayName?.toLowerCase() ||
      p.id === currentUser.uid
    );

    if (currentPlayerData) {
      // Determine if player won (highest score)
      const maxScore = Math.max(...players.map(p => p.score));
      const isWinner = currentPlayerData.score === maxScore;

      await recordMakesOrMissesGame({
        isWinner,
        points: currentPlayerData.score
      });
    }
  };

  const resetGame = () => {
    // Record stats before resetting
    recordGameStats();

    updateGame({
      players: players.map((p) => ({ ...p, score: 0 })),
      ledger: {},
      currentRound: 1,
      activePlayerIndex: 0,
      activePlayerChoice: null
    });
  };

  const leaveGame = () => {
    setInGame(false);
    setGameCode('');
    setJoinCode('');
    setIsHost(false);
  };

  const activePlayer = players[activePlayerIndex];
  const gameOver = currentRound > 50;

  if (!inGame) {
    return (
      <div className="game-container">
        <div className="game-background"></div>
        <div className="game-grid-overlay"></div>
        <div className="game-orb" style={{ top: '25%', left: '25%', backgroundColor: 'rgb(8, 145, 178)' }}></div>

        <div className="game-content flex items-center justify-center">
          <div className="max-w-md w-full game-card">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Target size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text-cyan">Makes or Misses</h1>
            </div>
            <p className="text-center text-primary mb-8 text-sm sm:text-base">Multiplayer Bowling Predictor</p>

            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full btn-primary-cyan flex items-center justify-center gap-2 text-lg sm:text-xl"
              >
                <Users size={20} className="sm:w-6 sm:h-6" />
                Create New Game
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900/50 text-secondary">OR</span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinGame()}
                  placeholder="Enter Game Code"
                  className="w-full game-input text-center text-lg font-mono"
                  maxLength={6}
                />
                <button
                  onClick={joinGame}
                  className="w-full btn-primary-cyan text-lg sm:text-xl"
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

  return (
    <div className="game-container">
      <div className="game-background"></div>
      <div className="game-grid-overlay"></div>
      <div className="game-orb" style={{ top: '25%', right: '25%', backgroundColor: 'rgb(8, 145, 178)' }}></div>

      <div className="game-content">
        <div className="game-max-width">
          <div className="game-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Target size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text-cyan">Makes or Misses</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="info-box">
                  <span className="text-xs sm:text-sm text-primary">Code:</span>
                  <span className="font-mono font-bold text-sm sm:text-lg ml-2 text-white">{gameCode}</span>
                </div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="btn-primary-cyan p-2"
                  title="Show QR code to join"
                >
                  <QrCode size={20} />
                </button>
              </div>
            </div>

          {showQR && (
            <div className="mb-6 bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-3">Scan to Join Game</h3>
                <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg">
                  <QRCodeSVG 
                    value={getJoinURL()} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-3 text-center max-w-sm">
                  Scan this QR code with your phone camera to join instantly
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Or manually enter code: <span className="font-mono font-bold">{gameCode}</span>
                </p>
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-3 text-cyan-400 hover:text-cyan-300 font-semibold text-sm"
                >
                  Hide QR Code
                </button>
              </div>
            </div>
          )}

          {!gameStarted ? (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-cyan-300">
                  Share code <span className="font-mono font-bold text-xl">{gameCode}</span> with friends or show them the QR code!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Enter Bowler's Name"
                  className="game-input"
                />
                <button
                  onClick={addPlayer}
                  className="btn-primary-orange flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} />
                  <span className="hidden sm:inline">Add Player</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {players.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-white">Bowlers ({players.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {players.map((player) => (
                      <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg shadow text-white">
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={startGame}
                disabled={players.length < 2}
                className="w-full bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition font-bold text-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {!gameOver ? (
                <>
                  <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-4 text-center">
                    <h2 className="text-2xl font-bold text-white">Round {currentRound}</h2>
                    <p className="text-lg mt-2 text-slate-300">
                      <span className="font-bold text-purple-600">{activePlayer?.name}</span>'s turn to choose
                    </p>
                  </div>

                  <div className="bg-amber-900/30 border-2 border-amber-500 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-center mb-4 text-white">
                      {activePlayer?.name}, make your choice:
                    </h3>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => makeChoice('make')}
                        disabled={activePlayerChoice !== null}
                        className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
                          activePlayerChoice === 'make'
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-800/50 border-2 border-green-500 text-green-600 hover:bg-green-50'
                        } disabled:opacity-50`}
                      >
                        <Check className="inline mr-2" size={24} />
                        Make
                      </button>
                      <button
                        onClick={() => makeChoice('miss')}
                        disabled={activePlayerChoice !== null}
                        className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
                          activePlayerChoice === 'miss'
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-800/50 border-2 border-red-500 text-red-600 hover:bg-red-50'
                        } disabled:opacity-50`}
                      >
                        <X className="inline mr-2" size={24} />
                        Miss
                      </button>
                    </div>

                    {activePlayerChoice && (
                      <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                        <p className="text-center text-slate-300 mb-3">
                          <span className="font-bold">{activePlayer?.name}</span> chose:{' '}
                          <span className={`font-bold ml-2 ${activePlayerChoice === 'make' ? 'text-green-600' : 'text-red-600'}`}>
                            {activePlayerChoice === 'make' ? 'MAKES' : 'MISSES'}
                          </span>
                        </p>
                        <p className="text-center text-sm text-slate-400 mb-4">
                          All other players automatically get:{' '}
                          <span className={`font-bold ml-2 ${activePlayerChoice === 'miss' ? 'text-green-600' : 'text-red-600'}`}>
                            {activePlayerChoice === 'miss' ? 'MAKES' : 'MISSES'}
                          </span>
                        </p>
                        <div className="border-t border-slate-700 pt-4">
                          <h4 className="font-bold text-center mb-3 text-white">What was the result?</h4>
                          <div className="flex gap-4">
                            <button
                              onClick={() => recordResult('make')}
                              className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-bold"
                            >
                              <Check className="inline mr-2" size={20} />
                              Made It!
                            </button>
                            <button
                              onClick={() => recordResult('miss')}
                              className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-bold"
                            >
                              <X className="inline mr-2" size={20} />
                              Missed!
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="player-grid">
                    {players.map((player, index) => {
                      const isActive = index === activePlayerIndex;
                      const prediction = isActive
                        ? activePlayerChoice
                        : activePlayerChoice === 'make'
                        ? 'miss'
                        : activePlayerChoice === 'miss'
                        ? 'make'
                        : null;

                      return (
                        <div
                          key={player.id}
                          className={`player-card ${isActive ? 'active bg-amber-900/30 border-2 border-amber-500' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm sm:text-base text-white">
                              {player.name} {isActive && '👈'}
                            </span>
                            <span className="score-badge">
                              {player.score}
                            </span>
                          </div>
                          {prediction && (
                            <div
                              className={`text-center py-2 rounded font-semibold text-sm ${
                                prediction === 'make' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
                              }`}
                            >
                              {prediction === 'make' ? 'MAKES' : 'MISSES'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg p-6 text-center">
                  <h2 className="text-3xl font-bold mb-4 text-white">🎉 Game Over! 🎉</h2>
                  <p className="text-xl mb-6 text-slate-300">50 rounds completed!</p>
                </div>
              )}

              <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/30 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                  <Trophy className="text-amber-400" size={24} />
                  Leaderboard
                </h3>
                <div className="space-y-2">
                  {[...players].sort((a, b) => b.score - a.score).map((player, idx) => {
                    const winnings = (player.score * QUARTER).toFixed(2);
                    const net = toMoney(netPointsFor(player.id));
                    return (
                      <div key={player.id} className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
                        <span className="font-semibold">
                          {idx === 0 && '🥇'} {idx === 1 && '🥈'} {idx === 2 && '🥉'} {player.name}
                        </span>
                        <span className="font-bold text-purple-600 text-sm">
                          {player.score} pts (${winnings}) · Net ${net}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mt-4">
                  <h4 className="font-bold text-md mb-2 text-white">💵 Owes Breakdown</h4>
                  {players.length <= 1 ? (
                    <p className="text-slate-400 text-sm">Add more players to calculate owes.</p>
                  ) : (
                    (() => {
                      const debtsByCreditor = {};
                      players.forEach((p) => (debtsByCreditor[p.id] = []));

                      Object.entries(ledger).forEach(([k, pts]) => {
                        if (!pts) return;
                        const [fromId, toId] = k.split('->').map(Number);
                        const debtor = players.find((p) => p.id === fromId);
                        const creditor = players.find((p) => p.id === toId);
                        if (!debtor || !creditor) return;

                        debtsByCreditor[toId].push({
                          debtorId: fromId,
                          debtorName: debtor.name,
                          pts,
                          money: toMoney(pts),
                        });
                      });

                      const groups = players
                        .map((cr) => {
                          const items = debtsByCreditor[cr.id] || [];
                          const total = items.reduce((s, it) => s + Number(it.money), 0).toFixed(2);
                          return { cr, items, total };
                        })
                        .filter((g) => g.items.length > 0);

                      return groups.length === 0 ? (
                        <p className="text-slate-300 text-sm">No debts yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {groups.map(({ cr, items, total }) => (
                            <div key={cr.id} className="bg-slate-800/50 rounded-md p-3">
                              <p className="text-slate-300 text-sm mb-2">
                                Payouts to <span className="font-semibold">{cr.name}</span>:
                              </p>
                              <ul className="list-disc ml-5 space-y-1">
                                {items.map((it) => (
                                  <li key={it.debtorId} className="text-white text-sm">
                                    {it.debtorName} owes {cr.name} ${it.money} ({it.pts} pts)
                                  </li>
                                ))}
                              </ul>
                              <p className="text-slate-300 text-sm mt-2">
                                {cr.name} total to collect: <span className="font-semibold">${total}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="flex-1 btn-primary-cyan"
                >
                  Reset Scores
                </button>
                <button
                  onClick={leaveGame}
                  className="flex-1 btn-secondary"
                >
                  Leave Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
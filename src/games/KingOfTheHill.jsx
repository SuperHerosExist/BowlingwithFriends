import React, { useState, useEffect } from 'react';
import { UserPlus, QrCode, Trophy, Crown, DollarSign } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { database } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';

export default function KingOfTheHill() {
  const [gameCode, setGameCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Game state
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentGame, setCurrentGame] = useState(1);
  const [scores, setScores] = useState({
    game1: {},
    game2: {},
    game3: {}
  });
  const [entryFee] = useState(5);
  const [perGamePrize] = useState(1);
  const [totalsPrize] = useState(2);

  // Generate the join URL for QR code
  const getJoinURL = () => {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?join=${gameCode}`;
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

  // Firebase sync
  useEffect(() => {
    if (!gameCode) return;

    const gameRef = ref(database, `kingofthehill/${gameCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        setGameStarted(data.gameStarted || false);
        setCurrentGame(data.currentGame || 1);
        setScores(data.scores || {
          game1: {},
          game2: {},
          game3: {}
        });
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  const createGame = () => {
    const code = generateGameCode();
    setGameCode(code);
    setIsHost(true);
    setInGame(true);

    const gameRef = ref(database, `kingofthehill/${code}`);
    set(gameRef, {
      players: [],
      gameStarted: false,
      currentGame: 1,
      scores: {
        game1: {},
        game2: {},
        game3: {}
      },
      createdAt: Date.now()
    });
  };

  const joinGame = async () => {
    if (!joinCode.trim()) return;

    const code = joinCode.toUpperCase();
    const gameRef = ref(database, `kingofthehill/${code}`);
    const snapshot = await get(gameRef);

    if (snapshot.exists()) {
      setGameCode(code);
      setIsHost(false);
      setInGame(true);
    } else {
      alert('Game not found! Check the code and try again.');
    }
  };

  const updateGame = async (updates) => {
    if (!gameCode) return;
    try {
      const gameRef = ref(database, `kingofthehill/${gameCode}`);
      const snapshot = await get(gameRef);
      const currentData = snapshot.val() || {};
      
      await set(gameRef, {
        ...currentData,
        ...updates
      });
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && !gameStarted) {
      const newPlayers = [...players, {
        id: Date.now(),
        name: newPlayerName.trim()
      }];
      updateGame({ players: newPlayers });
      setNewPlayerName('');
    }
  };

  const startGame = () => {
    if (players.length >= 2) {
      updateGame({
        gameStarted: true,
        currentGame: 1
      });
    }
  };

  const updateScore = async (gameNum, playerId, score) => {
    if (!gameCode) {
      console.log('No game code');
      return;
    }
    
    console.log('Updating score:', { gameNum, playerId, score });
    
    try {
      const gameRef = ref(database, `kingofthehill/${gameCode}`);
      const snapshot = await get(gameRef);
      const currentData = snapshot.val();
      
      console.log('Current data:', currentData);
      
      if (!currentData) {
        console.error('No current data found');
        return;
      }
      
      const newScores = JSON.parse(JSON.stringify(currentData.scores || {}));
      const gameKey = `game${gameNum}`;
      
      if (!newScores[gameKey]) {
        newScores[gameKey] = {};
      }
      
      newScores[gameKey][playerId] = score === '' ? null : parseInt(score);
      
      console.log('New scores:', newScores);
      
      await set(gameRef, {
        ...currentData,
        scores: newScores
      });
      
      console.log('Score updated successfully');
    } catch (error) {
      console.error('Error updating score:', error);
      alert('Error updating score: ' + error.message);
    }
  };

  const getPlayerScore = (gameNum, playerId) => {
    return scores?.[`game${gameNum}`]?.[playerId] ?? '';
  };

  const getHighScoreForGame = (gameNum) => {
    const gameScores = scores?.[`game${gameNum}`] || {};
    const validScores = Object.entries(gameScores)
      .filter(([_, score]) => score !== null && score !== undefined)
      .map(([playerId, score]) => ({ playerId: parseInt(playerId), score }));

    if (validScores.length === 0) return null;

    const maxScore = Math.max(...validScores.map(s => s.score));
    const winners = validScores.filter(s => s.score === maxScore);

    return { score: maxScore, playerIds: winners.map(w => w.playerId) };
  };

  const calculateTotals = () => {
    const totals = {};
    players.forEach(player => {
      const game1Score = scores?.game1?.[player.id] || 0;
      const game2Score = scores?.game2?.[player.id] || 0;
      const game3Score = scores?.game3?.[player.id] || 0;
      totals[player.id] = game1Score + game2Score + game3Score;
    });
    return totals;
  };

  const getHighTotals = () => {
    const totals = calculateTotals();
    const validTotals = Object.entries(totals)
      .filter(([_, total]) => total > 0)
      .map(([playerId, total]) => ({ playerId: parseInt(playerId), total }));

    if (validTotals.length === 0) return null;

    const maxTotal = Math.max(...validTotals.map(t => t.total));
    const winners = validTotals.filter(t => t.total === maxTotal);

    return { total: maxTotal, playerIds: winners.map(w => w.playerId) };
  };

  const calculateWinnings = () => {
    const winnings = {};
    players.forEach(player => {
      winnings[player.id] = -entryFee; // Everyone starts at -$5
    });

    // Game 1 winner(s)
    const game1High = getHighScoreForGame(1);
    if (game1High && game1High.playerIds.length > 0) {
      const prizePerWinner = (players.length * perGamePrize) / game1High.playerIds.length;
      game1High.playerIds.forEach(playerId => {
        winnings[playerId] += prizePerWinner;
      });
    }

    // Game 2 winner(s)
    const game2High = getHighScoreForGame(2);
    if (game2High && game2High.playerIds.length > 0) {
      const prizePerWinner = (players.length * perGamePrize) / game2High.playerIds.length;
      game2High.playerIds.forEach(playerId => {
        winnings[playerId] += prizePerWinner;
      });
    }

    // Game 3 winner(s)
    const game3High = getHighScoreForGame(3);
    if (game3High && game3High.playerIds.length > 0) {
      const prizePerWinner = (players.length * perGamePrize) / game3High.playerIds.length;
      game3High.playerIds.forEach(playerId => {
        winnings[playerId] += prizePerWinner;
      });
    }

    // High totals winner(s)
    const highTotals = getHighTotals();
    if (highTotals && highTotals.playerIds.length > 0) {
      const prizePerWinner = (players.length * totalsPrize) / highTotals.playerIds.length;
      highTotals.playerIds.forEach(playerId => {
        winnings[playerId] += prizePerWinner;
      });
    }

    return winnings;
  };

  const resetGame = () => {
    updateGame({
      scores: {
        game1: {},
        game2: {},
        game3: {}
      },
      currentGame: 1
    });
  };

  const leaveGame = () => {
    setInGame(false);
    setGameCode('');
    setJoinCode('');
    setIsHost(false);
  };

  const totals = calculateTotals();
  const winnings = calculateWinnings();
  const allGamesComplete = players.length > 0 && players.every(player =>
    scores?.game1?.[player.id] !== null && scores?.game1?.[player.id] !== undefined &&
    scores?.game2?.[player.id] !== null && scores?.game2?.[player.id] !== undefined &&
    scores?.game3?.[player.id] !== null && scores?.game3?.[player.id] !== undefined
  );

  if (!inGame) {
    return (
      <div className="game-container">
        <div className="game-background"></div>
        <div className="game-grid-overlay"></div>
        <div className="game-orb" style={{ top: '20%', left: '30%', backgroundColor: 'rgb(168, 85, 247)' }}></div>

        <div className="game-content flex items-center justify-center">
          <div className="max-w-md w-full game-card">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                <Crown size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text-purple">King of the Hill</h1>
            </div>
            <p className="text-center text-primary mb-8 text-sm sm:text-base">Battle for the highest scores!</p>

            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full btn-primary-purple flex items-center justify-center gap-2 text-lg sm:text-xl"
              >
                <Crown size={20} className="sm:w-6 sm:h-6" />
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
                  className="w-full btn-primary-purple text-lg sm:text-xl"
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
      <div className="game-orb" style={{ top: '20%', right: '30%', backgroundColor: 'rgb(168, 85, 247)' }}></div>

      <div className="game-content">
        <div className="game-max-width">
          <div className="game-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                  <Crown size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text-purple">King of the Hill</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="info-box">
                  <span className="text-xs sm:text-sm text-primary">Code:</span>
                  <span className="font-mono font-bold text-sm sm:text-lg ml-2 text-white">{gameCode}</span>
                </div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="btn-primary-purple p-2"
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
                <p className="text-sm text-primary mt-3 text-center max-w-sm">
                  Scan this QR code with your phone camera to join instantly
                </p>
                <p className="text-xs text-secondary mt-2">
                  Or manually enter code: <span className="font-mono font-bold">{gameCode}</span>
                </p>
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-3 text-purple-400 hover:text-purple-300 font-semibold text-sm"
                >
                  Hide QR Code
                </button>
              </div>
            </div>
          )}

          {!gameStarted ? (
            <div className="space-y-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-white">
                  <DollarSign className="text-green-400" size={20} />
                  Prize Structure
                </h3>
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-primary">Entry Fee:</span>
                    <span className="font-bold text-red-400">${entryFee}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-primary">High Game 1:</span>
                    <span className="font-bold text-green-400">${perGamePrize} per player</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-primary">High Game 2:</span>
                    <span className="font-bold text-green-400">${perGamePrize} per player</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-primary">High Game 3:</span>
                    <span className="font-bold text-green-400">${perGamePrize} per player</span>
                  </p>
                  <p className="flex justify-between border-t border-slate-700 pt-2">
                    <span className="text-primary font-semibold">High Totals:</span>
                    <span className="font-bold text-purple-400">${totalsPrize} per player</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-purple-300">
                  Share code <span className="font-mono font-bold text-xl">{gameCode}</span> with friends or show them the QR code!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Enter Player's Name"
                  className="game-input"
                />
                <button
                  onClick={addPlayer}
                  className="btn-primary-purple flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} />
                  <span className="hidden sm:inline">Add Player</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {players.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-white">Players ({players.length})</h3>
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg shadow flex justify-between items-center border border-slate-700">
                        <span className="text-white">{player.name}</span>
                        <span className="text-sm text-red-400 font-semibold">${entryFee} in</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-purple-900/30 border border-purple-700 rounded p-2 text-center">
                    <p className="text-sm text-primary">
                      Prize Pool: <span className="font-bold text-green-400">${players.length * entryFee}</span>
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={startGame}
                disabled={players.length < 2}
                className="w-full btn-primary-purple text-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/30 rounded-lg p-4">
                <h2 className="text-xl font-bold text-white text-center mb-3">3-Game Series</h2>
                <p className="text-center text-sm text-primary">High score each game wins ${perGamePrize} per player</p>
                <p className="text-center text-sm text-primary">High total wins ${totalsPrize} per player</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map(gameNum => {
                  const highScore = getHighScoreForGame(gameNum);
                  return (
                    <div key={gameNum} className="game-card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-white">Game {gameNum}</h3>
                        {highScore && (
                          <span className="text-sm text-purple-400 font-semibold flex items-center gap-1">
                            <Crown size={16} />
                            High: {highScore.score}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {players.map(player => {
                          const isHighScore = highScore && highScore.playerIds.includes(player.id);
                          return (
                            <div key={player.id}>
                              <label className="block text-xs font-medium text-primary mb-1">{player.name}</label>
                              <input
                                type="number"
                                value={getPlayerScore(gameNum, player.id)}
                                onChange={(e) => updateScore(gameNum, player.id, e.target.value)}
                                placeholder="Score"
                                className={`w-full game-input text-center text-lg font-bold ${
                                  isHighScore
                                    ? 'border-purple-400 bg-purple-900/30 text-purple-300'
                                    : ''
                                }`}
                                min="0"
                                max="300"
                              />
                              {isHighScore && (
                                <p className="text-xs text-purple-400 font-semibold mt-1 text-center">
                                  👑 Winner
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-slate-800/50 to-purple-900/30 rounded-lg p-4 border-2 border-purple-600">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                  <Trophy className="text-purple-400" size={24} />
                  Total Pins
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {players.map(player => {
                    const highTotals = getHighTotals();
                    const isHighTotal = highTotals && highTotals.playerIds.includes(player.id);
                    return (
                      <div key={player.id} className={`bg-slate-800/50 rounded-lg p-3 border ${isHighTotal ? 'ring-2 ring-purple-400 border-purple-500' : 'border-slate-700'}`}>
                        <p className="text-xs text-primary mb-1">{player.name}</p>
                        <p className={`text-2xl font-bold ${isHighTotal ? 'text-purple-400' : 'text-white'}`}>
                          {totals[player.id] || 0}
                          {isHighTotal && ' 👑'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {allGamesComplete && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border-2 border-green-500">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                    <DollarSign className="text-green-400" size={24} />
                    Final Payouts
                  </h3>
                  <div className="space-y-2">
                    {players
                      .sort((a, b) => winnings[b.id] - winnings[a.id])
                      .map((player, idx) => {
                        const amount = winnings[player.id];
                        const isWinner = amount > 0;
                        const isLoser = amount < 0;
                        return (
                          <div key={player.id} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center border border-slate-700">
                            <span className="font-semibold text-white">
                              {idx === 0 && amount > 0 && '👑 '}
                              {player.name}
                            </span>
                            <span className={`font-bold text-lg ${
                              isWinner ? 'text-green-400' : isLoser ? 'text-red-400' : 'text-primary'
                            }`}>
                              {isWinner ? '+' : ''}{amount >= 0 ? '$' + amount.toFixed(2) : '-$' + Math.abs(amount).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="flex-1 btn-primary-purple"
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
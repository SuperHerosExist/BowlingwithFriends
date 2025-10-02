import React, { useState, useEffect } from 'react';
import { Users, QrCode, Trophy, DollarSign, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { database } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';
import { useAuth } from '../AuthContext';
import { isAdmin } from '../adminConfig';

export default function MatchPlay() {
  const { currentUser } = useAuth();
  const isUserAdmin = currentUser && isAdmin(currentUser.email);
  const isGuest = currentUser?.isAnonymous;
  const [gameCode, setGameCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Game state
  const [player1, setPlayer1] = useState({ name: '', id: null });
  const [player2, setPlayer2] = useState({ name: '', id: null });
  const [gameStarted, setGameStarted] = useState(false);
  const [currentGame, setCurrentGame] = useState(1);
  const [scores, setScores] = useState({
    game1: { player1: null, player2: null },
    game2: { player1: null, player2: null },
    game3: { player1: null, player2: null },
  });
  const [stakes, setStakes] = useState({
    perGame: 5,
    totals: 5
  });

  // Generate the join URL for QR code
  const getJoinURL = () => {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?join=${gameCode}&game=match-play`;
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

    const gameRef = ref(database, `matchplay/${gameCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayer1(data.player1 || { name: '', id: null });
        setPlayer2(data.player2 || { name: '', id: null });
        setGameStarted(data.gameStarted || false);
        setCurrentGame(data.currentGame || 1);
        setScores(data.scores || {
          game1: { player1: null, player2: null },
          game2: { player1: null, player2: null },
          game3: { player1: null, player2: null },
        });
        setStakes(data.stakes || { perGame: 5, totals: 5 });
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  const createGame = () => {
    // Prevent guests from creating games with score entry
    if (isGuest) {
      alert('Please sign in to play Match Play. Guests can only play Makes or Misses.');
      return;
    }

    const code = generateGameCode();
    setGameCode(code);
    setIsHost(true);
    setInGame(true);

    const gameRef = ref(database, `matchplay/${code}`);
    set(gameRef, {
      player1: { name: '', id: null, uid: null },
      player2: { name: '', id: null, uid: null },
      gameStarted: false,
      currentGame: 1,
      scores: {
        game1: { player1: null, player2: null },
        game2: { player1: null, player2: null },
        game3: { player1: null, player2: null },
      },
      stakes: { perGame: 5, totals: 5 },
      createdAt: Date.now()
    });
  };

  const joinGame = async () => {
    if (!joinCode.trim()) return;

    // Prevent guests from joining games with score entry
    if (isGuest) {
      alert('Please sign in to play Match Play. Guests can only play Makes or Misses.');
      return;
    }

    const code = joinCode.toUpperCase();
    const gameRef = ref(database, `matchplay/${code}`);
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
      const gameRef = ref(database, `matchplay/${gameCode}`);
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

  const setPlayerName = (playerNum, name) => {
    if (playerNum === 1) {
      updateGame({ player1: { name, id: Date.now(), uid: currentUser?.uid } });
    } else {
      updateGame({ player2: { name, id: Date.now(), uid: currentUser?.uid } });
    }
  };

  const startMatch = () => {
    if (player1.name && player2.name) {
      updateGame({ gameStarted: true });
    }
  };

  const updateScore = async (gameNum, playerNum, score) => {
    if (!gameCode) {
      console.log('No game code');
      return;
    }

    // Check if user can edit this player's score
    const playerToEdit = playerNum === 1 ? player1 : player2;
    const canEdit = isUserAdmin || playerToEdit.uid === currentUser?.uid;

    if (!canEdit) {
      alert('You can only enter your own scores. Admins can enter any score.');
      return;
    }

    console.log('Updating score:', { gameNum, playerNum, score });
    
    try {
      const gameRef = ref(database, `matchplay/${gameCode}`);
      const snapshot = await get(gameRef);
      const currentData = snapshot.val();
      
      console.log('Current data:', currentData);
      
      if (!currentData) {
        console.error('No current data found');
        return;
      }
      
      const newScores = JSON.parse(JSON.stringify(currentData.scores || {}));
      const gameKey = `game${gameNum}`;
      const playerKey = `player${playerNum}`;
      
      if (!newScores[gameKey]) {
        newScores[gameKey] = { player1: null, player2: null };
      }
      
      newScores[gameKey][playerKey] = score === '' ? null : parseInt(score);
      
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

  const updateStakes = async (type, value) => {
    if (!gameCode) return;
    try {
      const gameRef = ref(database, `matchplay/${gameCode}`);
      const snapshot = await get(gameRef);
      const currentData = snapshot.val();
      
      if (!currentData) return;
      
      const newStakes = { ...currentData.stakes };
      newStakes[type] = parseFloat(value) || 0;
      
      await set(gameRef, {
        ...currentData,
        stakes: newStakes
      });
    } catch (error) {
      console.error('Error updating stakes:', error);
    }
  };

  const calculateTotals = () => {
    const p1Total = (scores?.game1?.player1 || 0) + (scores?.game2?.player1 || 0) + (scores?.game3?.player1 || 0);
    const p2Total = (scores?.game1?.player2 || 0) + (scores?.game2?.player2 || 0) + (scores?.game3?.player2 || 0);
    return { player1: p1Total, player2: p2Total };
  };

  const calculateWinnings = () => {
    let p1Winnings = 0;
    let p2Winnings = 0;

    // Individual game wins
    ['game1', 'game2', 'game3'].forEach(game => {
      const p1Score = scores?.[game]?.player1;
      const p2Score = scores?.[game]?.player2;
      if (p1Score !== null && p1Score !== undefined && p2Score !== null && p2Score !== undefined) {
        if (p1Score > p2Score) p1Winnings += stakes.perGame;
        else if (p2Score > p1Score) p2Winnings += stakes.perGame;
      }
    });

    // Totals win
    const totals = calculateTotals();
    if (totals.player1 > totals.player2) {
      p1Winnings += stakes.totals;
    } else if (totals.player2 > totals.player1) {
      p2Winnings += stakes.totals;
    }

    const net1 = p1Winnings - p2Winnings;
    const net2 = p2Winnings - p1Winnings;

    return { player1: net1, player2: net2 };
  };

  const resetMatch = () => {
    updateGame({
      scores: {
        game1: { player1: null, player2: null },
        game2: { player1: null, player2: null },
        game3: { player1: null, player2: null },
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
  const allGamesComplete = scores?.game1?.player1 !== null && scores?.game1?.player1 !== undefined &&
                            scores?.game1?.player2 !== null && scores?.game1?.player2 !== undefined &&
                            scores?.game2?.player1 !== null && scores?.game2?.player1 !== undefined &&
                            scores?.game2?.player2 !== null && scores?.game2?.player2 !== undefined &&
                            scores?.game3?.player1 !== null && scores?.game3?.player1 !== undefined &&
                            scores?.game3?.player2 !== null && scores?.game3?.player2 !== undefined;

  if (!inGame) {
    return (
      <div className="game-container">
        <div className="game-background"></div>
        <div className="game-grid-overlay"></div>
        <div className="game-orb" style={{ top: '20%', left: '30%', backgroundColor: 'rgb(34, 197, 94)' }}></div>

        <div className="game-content flex items-center justify-center">
          <div className="max-w-md w-full game-card">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Trophy size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text-green">Match Play</h1>
            </div>
            <p className="text-center text-primary mb-8 text-sm sm:text-base">Head-to-Head Bowling Match</p>

            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full btn-primary-green flex items-center justify-center gap-2 text-lg sm:text-xl"
              >
                <Users size={24} />
                Create New Match
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
                  className="w-full btn-primary-green text-lg sm:text-xl"
                >
                  Join Match
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
      <div className="game-orb" style={{ top: '20%', right: '30%', backgroundColor: 'rgb(34, 197, 94)' }}></div>

      <div className="game-content">
        <div className="game-max-width">
          <div className="game-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Trophy size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text-green">Match Play</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="info-box">
                  <span className="text-xs sm:text-sm text-primary">Code:</span>
                  <span className="font-mono font-bold text-sm sm:text-lg ml-2 text-white">{gameCode}</span>
                </div>
                <button
                onClick={() => setShowQR(!showQR)}
                className="btn-primary-green p-2"
                title="Show QR code to join"
              >
                <QrCode size={20} />
              </button>
            </div>
          </div>

          {showQR && (
            <div className="mb-6 bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-3">Scan to Join Match</h3>
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
                  className="mt-3 text-green-400 hover:text-green-300 font-semibold text-sm"
                >
                  Hide QR Code
                </button>
              </div>
            </div>
          )}

          {!gameStarted ? (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p style={{ color: 'rgb(134, 239, 172)' }}>
                  Share code <span className="font-mono font-bold text-xl" style={{ color: 'rgb(255, 255, 255)' }}>{gameCode}</span> with your opponent!
                </p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-white">
                  <DollarSign className="text-green-400" size={20} />
                  Stakes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Per Game</label>
                    <div className="flex items-center">
                      <span className="mr-2 text-primary">$</span>
                      <input
                        type="number"
                        value={stakes.perGame}
                        onChange={(e) => updateStakes('perGame', e.target.value)}
                        className="game-input"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Totals</label>
                    <div className="flex items-center">
                      <span className="mr-2 text-primary">$</span>
                      <input
                        type="number"
                        value={stakes.totals}
                        onChange={(e) => updateStakes('totals', e.target.value)}
                        className="game-input"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Player 1</label>
                  <input
                    type="text"
                    value={player1.name}
                    onChange={(e) => setPlayerName(1, e.target.value)}
                    placeholder="Enter Player 1's Name"
                    className="w-full game-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Player 2</label>
                  <input
                    type="text"
                    value={player2.name}
                    onChange={(e) => setPlayerName(2, e.target.value)}
                    placeholder="Enter Player 2's Name"
                    className="w-full game-input"
                  />
                </div>
              </div>

              <button
                onClick={startMatch}
                disabled={!player1.name || !player2.name}
                className="w-full btn-primary-green text-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(!player1.name || !player2.name) ? 'Enter both player names' : 'Start Match'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-4">
                <h2 className="text-xl font-bold text-white text-center mb-4">Best of 3 Games</h2>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="font-semibold text-lg text-green-400">{player1.name}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="font-semibold text-lg text-green-400">{player2.name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map(gameNum => (
                  <div key={gameNum} className="game-card">
                    <h3 className="font-bold text-lg mb-3 text-white">Game {gameNum}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">{player1.name}</label>
                        <input
                          type="number"
                          value={scores[`game${gameNum}`]?.player1 ?? ''}
                          onChange={(e) => updateScore(gameNum, 1, e.target.value)}
                          placeholder="Score"
                          className="w-full game-input text-center text-lg font-bold"
                          min="0"
                          max="300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">{player2.name}</label>
                        <input
                          type="number"
                          value={scores[`game${gameNum}`]?.player2 ?? ''}
                          onChange={(e) => updateScore(gameNum, 2, e.target.value)}
                          placeholder="Score"
                          className="w-full game-input text-center text-lg font-bold"
                          min="0"
                          max="300"
                        />
                      </div>
                    </div>
                    {scores[`game${gameNum}`]?.player1 !== null && scores[`game${gameNum}`]?.player1 !== undefined &&
                     scores[`game${gameNum}`]?.player2 !== null && scores[`game${gameNum}`]?.player2 !== undefined && (
                      <div className="mt-3 text-center">
                        {scores[`game${gameNum}`].player1 > scores[`game${gameNum}`].player2 ? (
                          <p className="text-green-400 font-semibold">🏆 {player1.name} wins (+${stakes.perGame})</p>
                        ) : scores[`game${gameNum}`].player2 > scores[`game${gameNum}`].player1 ? (
                          <p className="text-green-400 font-semibold">🏆 {player2.name} wins (+${stakes.perGame})</p>
                        ) : (
                          <p className="text-primary font-semibold">Tie</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-slate-800/50 to-green-900/30 rounded-lg p-4 border-2 border-green-600">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                  <Trophy className="text-green-400" size={24} />
                  Totals
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-sm text-primary mb-1">{player1.name}</p>
                    <p className="text-3xl font-bold text-green-400">{totals.player1}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-sm text-primary mb-1">{player2.name}</p>
                    <p className="text-3xl font-bold text-green-400">{totals.player2}</p>
                  </div>
                </div>
                {allGamesComplete && (
                  <div className="mt-3 text-center">
                    {totals.player1 > totals.player2 ? (
                      <p className="text-green-400 font-semibold text-lg">🏆 {player1.name} wins totals (+${stakes.totals})</p>
                    ) : totals.player2 > totals.player1 ? (
                      <p className="text-green-400 font-semibold text-lg">🏆 {player2.name} wins totals (+${stakes.totals})</p>
                    ) : (
                      <p className="text-primary font-semibold text-lg">Totals tied</p>
                    )}
                  </div>
                )}
              </div>

              {allGamesComplete && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border-2 border-green-500">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                    <DollarSign className="text-green-400" size={24} />
                    Final Payout
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    {winnings.player1 > 0 ? (
                      <p className="text-center text-xl font-bold text-green-400">
                        {player1.name} wins ${Math.abs(winnings.player1).toFixed(2)}
                      </p>
                    ) : winnings.player2 > 0 ? (
                      <p className="text-center text-xl font-bold text-green-400">
                        {player2.name} wins ${Math.abs(winnings.player2).toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-center text-xl font-bold text-primary">Match tied - No payout</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={resetMatch}
                  className="flex-1 btn-primary-green"
                >
                  Reset Scores
                </button>
                <button
                  onClick={leaveGame}
                  className="flex-1 btn-secondary"
                >
                  Leave Match
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
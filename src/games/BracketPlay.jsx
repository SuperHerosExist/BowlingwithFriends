import React, { useState, useEffect } from 'react';
import { UserPlus, QrCode, Trophy, DollarSign, Shuffle, Network, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { database } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';
import { useAuth } from '../AuthContext';
import { isAdmin } from '../adminConfig';

export default function BracketPlay() {
  const { currentUser } = useAuth();
  const isUserAdmin = currentUser && isAdmin(currentUser.email);
  const isGuest = currentUser?.isAnonymous;
  const [gameCode, setGameCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Game state
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [matches, setMatches] = useState({
    quarterfinals: [],
    semifinals: [],
    finals: null,
    champion: null
  });
  const [scores, setScores] = useState({});
  const [entryFee, setEntryFee] = useState(5);
  const [firstPlacePrize, setFirstPlacePrize] = useState(0);
  const [secondPlacePrize, setSecondPlacePrize] = useState(0);

  const getJoinURL = () => {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?join=${gameCode}`;
  };

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get('join');
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
    }
  }, []);

  useEffect(() => {
    const totalPot = players.length * entryFee;
    // 60% to first place, 40% to second place
    setFirstPlacePrize(Math.floor(totalPot * 0.6));
    setSecondPlacePrize(Math.floor(totalPot * 0.4));
  }, [players.length, entryFee]);

  useEffect(() => {
    if (!gameCode) return;

    const gameRef = ref(database, `bracketplay/${gameCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data.players || []);
        setGameStarted(data.gameStarted || false);
        setMatches(data.matches || {
          quarterfinals: [],
          semifinals: [],
          finals: null,
          champion: null
        });
        setScores(data.scores || {});
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  const createGame = () => {
    // Prevent guests from creating games with score entry
    if (isGuest) {
      alert('Please sign in to play Bracket Play. Guests can only play Makes or Misses.');
      return;
    }

    const code = generateGameCode();
    setGameCode(code);
    setIsHost(true);
    setInGame(true);

    const gameRef = ref(database, `bracketplay/${code}`);
    set(gameRef, {
      players: [],
      gameStarted: false,
      matches: {
        quarterfinals: [],
        semifinals: [],
        finals: null,
        champion: null
      },
      scores: {},
      createdAt: Date.now()
    });
  };

  const joinGame = async () => {
    if (!joinCode.trim()) return;

    // Prevent guests from joining games with score entry
    if (isGuest) {
      alert('Please sign in to play Bracket Play. Guests can only play Makes or Misses.');
      return;
    }

    const code = joinCode.toUpperCase();
    const gameRef = ref(database, `bracketplay/${code}`);
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
      const gameRef = ref(database, `bracketplay/${gameCode}`);
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

  const addPlayer = async () => {
    if (newPlayerName.trim() && !gameStarted && players.length < 8) {
      const newPlayers = [...players, {
        id: Date.now(),
        name: newPlayerName.trim(),
        uid: currentUser?.uid
      }];
      await updateGame({ players: newPlayers });
      setNewPlayerName('');
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startTournament = async () => {
    if (players.length !== 8) {
      console.error('Need exactly 8 players to start tournament');
      return;
    }

    try {
      const shuffled = shuffleArray(players);
      console.log('Shuffled players:', shuffled);

      // Validate all players have id and name
      if (!shuffled.every(p => p && p.id && p.name)) {
        console.error('Invalid player data:', shuffled);
        alert('Error: Invalid player data. Please refresh and try again.');
        return;
      }

      const quarterfinals = [
        { id: 'qf1', player1: shuffled[0], player2: shuffled[1], winner: null },
        { id: 'qf2', player1: shuffled[2], player2: shuffled[3], winner: null },
        { id: 'qf3', player1: shuffled[4], player2: shuffled[5], winner: null },
        { id: 'qf4', player1: shuffled[6], player2: shuffled[7], winner: null }
      ];

      console.log('Created quarterfinals:', quarterfinals);

      await updateGame({
        gameStarted: true,
        matches: {
          quarterfinals,
          semifinals: [],
          finals: null,
          champion: null
        },
        scores: {} // Clear all scores when starting
      });

      console.log('Tournament started successfully');
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert('Failed to start tournament. Check console for details.');
    }
  };

  const updateScore = async (matchId, playerId, score) => {
    const newScores = { ...scores };
    const key = `${matchId}_${playerId}`;
    
    // Allow empty string or valid numbers only
    if (score === '') {
      newScores[key] = '';
    } else {
      const parsed = parseInt(score, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 300) {
        newScores[key] = parsed;
      } else {
        return; // Don't update if invalid
      }
    }
    
    setScores(newScores);
    
    try {
      await updateGame({ scores: newScores });
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  const getScore = (matchId, playerId) => {
    const key = `${matchId}_${playerId}`;
    return scores[key] ?? '';
  };

  const isMatchComplete = (matchId, player1Id, player2Id) => {
    const p1Score = getScore(matchId, player1Id);
    const p2Score = getScore(matchId, player2Id);
    
    // Convert to numbers for comparison
    const p1Num = typeof p1Score === 'number' ? p1Score : parseInt(p1Score, 10);
    const p2Num = typeof p2Score === 'number' ? p2Score : parseInt(p2Score, 10);
    
    const p1Valid = !isNaN(p1Num) && p1Num >= 0;
    const p2Valid = !isNaN(p2Num) && p2Num >= 0;
    
    console.log(`isMatchComplete(${matchId}): p1Score=${p1Score}, p2Score=${p2Score}, p1Valid=${p1Valid}, p2Valid=${p2Valid}, result=${p1Valid && p2Valid}`);
    
    return p1Valid && p2Valid;
  };

  const advanceAllWinners = async (round) => {
    const newMatches = { ...matches };

    if (round === 'quarterfinals') {
      // Set winners for all quarterfinals based on scores
      newMatches.quarterfinals = newMatches.quarterfinals.map(match => {
        const p1Score = getScore(match.id, match.player1.id);
        const p2Score = getScore(match.id, match.player2.id);
        const winner = p1Score > p2Score ? match.player1 : match.player2;
        return { ...match, winner };
      });

      // Create semifinals
      newMatches.semifinals = [
        {
          id: 'sf1',
          player1: newMatches.quarterfinals[0].winner,
          player2: newMatches.quarterfinals[1].winner,
          winner: null
        },
        {
          id: 'sf2',
          player1: newMatches.quarterfinals[2].winner,
          player2: newMatches.quarterfinals[3].winner,
          winner: null
        }
      ];
    } else if (round === 'semifinals') {
      // Set winners for both semifinals
      newMatches.semifinals = newMatches.semifinals.map(match => {
        const p1Score = getScore(match.id, match.player1.id);
        const p2Score = getScore(match.id, match.player2.id);
        const winner = p1Score > p2Score ? match.player1 : match.player2;
        return { ...match, winner };
      });

      // Create finals
      newMatches.finals = {
        id: 'final',
        player1: newMatches.semifinals[0].winner,
        player2: newMatches.semifinals[1].winner,
        winner: null
      };
    } else if (round === 'finals') {
      const match = newMatches.finals;
      const p1Score = getScore(match.id, match.player1.id);
      const p2Score = getScore(match.id, match.player2.id);
      const winner = p1Score > p2Score ? match.player1 : match.player2;
      
      newMatches.finals.winner = winner;
      newMatches.champion = winner;
    }

    await updateGame({ matches: newMatches });
  };

  const areAllMatchesComplete = (matchList) => {
    if (!matchList || matchList.length === 0) return false;
    return matchList.every(match =>
      match && match.player1 && match.player2 && isMatchComplete(match.id, match.player1.id, match.player2.id)
    );
  };

  const resetTournament = async () => {
    await updateGame({
      matches: {
        quarterfinals: [],
        semifinals: [],
        finals: null,
        champion: null
      },
      scores: {},
      gameStarted: false
    });
  };

  const leaveGame = () => {
    setInGame(false);
    setGameCode('');
    setJoinCode('');
    setIsHost(false);
  };

  const renderMatch = (match, round) => {
    if (!match || !match.player1 || !match.player2) {
      return null;
    }

    const p1Score = getScore(match.id, match.player1.id);
    const p2Score = getScore(match.id, match.player2.id);
    const isComplete = isMatchComplete(match.id, match.player1.id, match.player2.id);
    const hasWinner = match.winner !== null;

    console.log(`${match.id}: p1Score=${p1Score} (${typeof p1Score}), p2Score=${p2Score} (${typeof p2Score}), isComplete=${isComplete}, hasWinner=${hasWinner}`);

    // Determine who is currently winning (even if not confirmed)
    const p1Winning = isComplete && p1Score > p2Score;
    const p2Winning = isComplete && p2Score > p1Score;

    return (
      <div className="game-card">
        <h4 className="font-bold text-sm text-center mb-3 text-orange-400">
          {match.id.toUpperCase()}
        </h4>

        <div className={`mb-3 p-3 rounded-lg ${
          hasWinner && match.winner?.id === match.player1.id
            ? 'bg-green-900/30 border-2 border-green-500'
            : p1Winning && !hasWinner
            ? 'bg-orange-900/30 border-2 border-orange-400'
            : 'bg-slate-800/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white">{match.player1.name || 'Player 1'}</span>
            {hasWinner && match.winner?.id === match.player1.id && (
              <Trophy className="text-orange-400" size={16} />
            )}
            {!hasWinner && p1Winning && (
              <span className="text-green-400 font-bold text-xs">LEADING</span>
            )}
          </div>
          <input
            type="text"
            name={`${match.id}_player1_score`}
            inputMode="numeric"
            pattern="[0-9]*"
            value={p1Score === '' ? '' : p1Score}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                updateScore(match.id, match.player1.id, value);
              }
            }}
            placeholder="Score"
            className="w-full game-input text-center text-xl font-bold"
          />
        </div>

        <div className="text-center text-xs font-bold text-secondary mb-3">VS</div>

        <div className={`mb-3 p-3 rounded-lg ${
          hasWinner && match.winner?.id === match.player2.id
            ? 'bg-green-900/30 border-2 border-green-500'
            : p2Winning && !hasWinner
            ? 'bg-orange-900/30 border-2 border-orange-400'
            : 'bg-slate-800/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white">{match.player2.name || 'Player 2'}</span>
            {hasWinner && match.winner?.id === match.player2.id && (
              <Trophy className="text-orange-400" size={16} />
            )}
            {!hasWinner && p2Winning && (
              <span className="text-green-400 font-bold text-xs">LEADING</span>
            )}
          </div>
          <input
            type="text"
            name={`${match.id}_player2_score`}
            inputMode="numeric"
            pattern="[0-9]*"
            value={p2Score === '' ? '' : p2Score}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                updateScore(match.id, match.player2.id, value);
              }
            }}
            placeholder="Score"
            className="w-full game-input text-center text-xl font-bold"
          />
        </div>

        {!hasWinner && !isComplete && (
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <p className="text-xs text-secondary">
              Enter both scores
            </p>
          </div>
        )}

        {!hasWinner && isComplete && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-2 text-center">
            <p className="text-xs font-bold text-green-400">
              ✓ Winner: {p1Score > p2Score ? match.player1.name : match.player2.name}
            </p>
          </div>
        )}

        {hasWinner && match.winner && (
          <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-2 text-center">
            <p className="text-xs font-bold text-green-400">
              🏆 {match.winner.name} advances to next round!
            </p>
          </div>
        )}
      </div>
    );
  };

  const runnerUp = matches.finals && matches.finals.winner
    ? (matches.finals.winner.id === matches.finals.player1.id ? matches.finals.player2 : matches.finals.player1)
    : null;

  if (!inGame) {
    return (
      <div className="game-container">
        <div className="game-background"></div>
        <div className="game-grid-overlay"></div>
        <div className="game-orb" style={{ top: '20%', left: '30%', backgroundColor: 'rgb(249, 115, 22)' }}></div>

        <div className="game-content flex items-center justify-center">
          <div className="max-w-md w-full game-card">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                <Network size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text-orange">Bracket Play</h1>
            </div>
            <p className="text-center text-primary mb-8 text-sm sm:text-base">8-Player Single Elimination Tournament</p>

            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full btn-primary-orange flex items-center justify-center gap-2 text-lg sm:text-xl"
              >
                <Trophy size={20} className="sm:w-6 sm:h-6" />
                Create Tournament
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
                  className="w-full btn-primary-orange text-lg sm:text-xl"
                >
                  Join Tournament
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
      <div className="game-orb" style={{ top: '20%', right: '30%', backgroundColor: 'rgb(249, 115, 22)' }}></div>

      <div className="game-content">
        <div className="max-w-7xl mx-auto">
          <div className="game-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                  <Network size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text-orange">Bracket Play</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="info-box">
                  <span className="text-xs sm:text-sm text-primary">Code:</span>
                  <span className="font-mono font-bold text-sm sm:text-lg ml-2 text-white">{gameCode}</span>
                </div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="btn-primary-orange p-2"
                  title="Show QR code to join"
                >
                  <QrCode size={20} />
                </button>
              </div>
            </div>

          {showQR && (
            <div className="mb-6 bg-slate-800/50 border-2 border-slate-700 rounded-lg p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-3">Scan to Join Tournament</h3>
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
                  className="mt-3 text-orange-400 hover:text-orange-300 font-semibold text-sm"
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

                {/* Entry Fee Selector */}
                {players.length === 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(148, 163, 184)' }}>
                      Select Entry Fee:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 5, 10].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setEntryFee(amount)}
                          className="px-4 py-2 rounded-lg transition"
                          style={{
                            backgroundColor: entryFee === amount ? 'rgb(139, 92, 246)' : 'rgb(30, 41, 59)',
                            color: 'rgb(255, 255, 255)',
                            border: entryFee === amount ? '2px solid rgb(167, 139, 250)' : '2px solid transparent'
                          }}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span style={{ color: 'rgb(148, 163, 184)' }}>Entry Fee:</span>
                    <span className="font-bold" style={{ color: 'rgb(248, 113, 113)' }}>${entryFee}</span>
                  </p>
                  <p className="flex justify-between">
                    <span style={{ color: 'rgb(148, 163, 184)' }}>2nd Place:</span>
                    <span className="font-bold" style={{ color: 'rgb(203, 213, 225)' }}>${secondPlacePrize}</span>
                  </p>
                  <p className="flex justify-between border-t border-slate-700 pt-2">
                    <span style={{ color: 'rgb(148, 163, 184)', fontWeight: 600 }}>1st Place:</span>
                    <span className="font-bold" style={{ color: 'rgb(74, 222, 128)' }}>${firstPlacePrize}</span>
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'rgb(100, 116, 139)' }}>
                    Total Prize Pool: ${players.length * entryFee}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 text-white">Tournament Format</h3>
                <ul className="text-sm space-y-1" style={{ color: 'rgb(148, 163, 184)' }}>
                  <li>• <strong className="text-white">Quarterfinals (Game 1):</strong> 8 players compete → 4 winners advance</li>
                  <li>• <strong className="text-white">Semifinals (Game 2):</strong> 4 players compete → 2 winners advance</li>
                  <li>• <strong className="text-white">Finals (Game 3):</strong> 2 players compete → Champion crowned</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p style={{ color: 'rgb(253, 186, 116)' }}>
                  Share code <span className="font-mono font-bold text-xl" style={{ color: 'rgb(255, 255, 255)' }}>{gameCode}</span> with 7 friends!
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
                  disabled={players.length >= 8}
                />
                <button
                  onClick={addPlayer}
                  disabled={players.length >= 8}
                  className="btn-primary-orange flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={20} />
                  <span className="hidden sm:inline">Add Player</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {players.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-white">Players ({players.length}/8)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player, idx) => (
                      <div key={player.id} className="bg-slate-800/50 px-4 py-2 rounded-lg shadow border border-slate-700 text-white">
                        {idx + 1}. {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={startTournament}
                disabled={players.length !== 8}
                className="w-full btn-primary-orange text-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Shuffle size={20} className="sm:w-6 sm:h-6" />
                {players.length !== 8 ? `Need ${8 - players.length} more player${8 - players.length !== 1 ? 's' : ''}` : 'Start Tournament (Randomize Bracket)'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.champion && (
                <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-lg p-6 border-2 border-orange-500">
                  <h2 className="text-3xl font-bold text-center mb-4 flex items-center justify-center gap-2 text-white">
                    <Trophy className="text-orange-400" size={40} />
                    Tournament Champion!
                  </h2>
                  <div className="bg-slate-800/50 rounded-lg p-6 mb-4 border border-slate-700">
                    <p className="text-center text-2xl font-bold text-green-400 mb-2">
                      🥇 {matches.champion.name}
                    </p>
                    <p className="text-center text-xl font-bold text-green-400">
                      Prize: ${firstPlacePrize}
                    </p>
                  </div>
                  {runnerUp && (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-center text-lg font-bold text-primary">
                        🥈 Runner-up: {runnerUp.name}
                      </p>
                      <p className="text-center text-md font-bold text-primary">
                        Prize: ${secondPlacePrize}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {matches?.quarterfinals && matches.quarterfinals.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">Quarterfinals</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {matches.quarterfinals.filter(m => m && m.id && m.player1 && m.player2).map(match => (
                      <div key={match.id}>{renderMatch(match, 'quarterfinals')}</div>
                    ))}
                  </div>

                  {(!matches.semifinals || matches.semifinals.length === 0) &&
                   areAllMatchesComplete(matches.quarterfinals) && (
                    <button
                      onClick={() => advanceAllWinners('quarterfinals')}
                      className="w-full mt-6 bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition font-bold text-xl shadow-lg"
                    >
                      ✓ Advance 4 Winners to Semifinals
                    </button>
                  )}
                </div>
              )}

              {matches?.semifinals && matches.semifinals.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">Semifinals</h2>
                  <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {matches.semifinals.filter(m => m && m.id && m.player1 && m.player2).map(match => (
                      <div key={match.id}>{renderMatch(match, 'semifinals')}</div>
                    ))}
                  </div>

                  {!matches.finals &&
                   areAllMatchesComplete(matches.semifinals) && (
                    <button
                      onClick={() => advanceAllWinners('semifinals')}
                      className="w-full mt-6 bg-green-500 text-white py-4 rounded-lg hover:bg-green-600 transition font-bold text-xl shadow-lg"
                    >
                      ✓ Advance 2 Winners to Finals
                    </button>
                  )}
                </div>
              )}

              {matches.finals && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white text-center">🏆 Championship Finals 🏆</h2>
                  <div className="max-w-md mx-auto">
                    {renderMatch(matches.finals, 'finals')}
                  </div>

                  {!matches.finals.winner &&
                   isMatchComplete(matches.finals.id, matches.finals.player1.id, matches.finals.player2.id) && (
                    <button
                      onClick={() => advanceAllWinners('finals')}
                      className="w-full mt-6 bg-orange-500 text-white py-4 rounded-lg hover:bg-orange-600 transition font-bold text-xl shadow-lg"
                    >
                      👑 Crown the Champion!
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={resetTournament}
                  className="flex-1 btn-primary-orange"
                >
                  Reset Tournament
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
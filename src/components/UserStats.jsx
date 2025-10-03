import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, Users, Crown, Network, TrendingUp, History, Calendar } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';

export default function UserStats({ isOpen, onClose }) {
  const { currentUser, isGuest } = useAuth();
  const [stats, setStats] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('stats'); // 'stats' or 'history'

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserData();
    }
  }, [isOpen, currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Fetch stats
      const userRef = ref(database, `users/${currentUser.uid}/stats`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setStats(snapshot.val());
      } else {
        setStats({
          makesOrMisses: { gamesPlayed: 0, totalPoints: 0, wins: 0, losses: 0 },
          matchPlay: { gamesPlayed: 0, wins: 0, losses: 0, ties: 0 },
          kingOfTheHill: { gamesPlayed: 0, highGameWins: 0, highTotalWins: 0 },
          bracketPlay: { tournamentsPlayed: 0, championships: 0, runnerUps: 0 }
        });
      }

      // Fetch game history from all game types
      await fetchGameHistory();
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameHistory = async () => {
    const history = [];

    try {
      // Fetch Makes or Misses games
      const momRef = ref(database, 'games');
      const momSnapshot = await get(momRef);
      if (momSnapshot.exists()) {
        Object.entries(momSnapshot.val()).forEach(([code, game]) => {
          const participant = game.players?.find(p => p.uid === currentUser.uid);
          if (participant) {
            history.push({
              type: 'Makes or Misses',
              code,
              date: game.createdAt || 0,
              players: game.players || [],
              myScore: participant.score || 0,
              gameStarted: game.gameStarted,
              currentRound: game.currentRound || 0
            });
          }
        });
      }

      // Fetch Match Play games
      const mpRef = ref(database, 'matchplay');
      const mpSnapshot = await get(mpRef);
      if (mpSnapshot.exists()) {
        Object.entries(mpSnapshot.val()).forEach(([code, game]) => {
          if (game.player1?.uid === currentUser.uid || game.player2?.uid === currentUser.uid) {
            history.push({
              type: 'Match Play',
              code,
              date: game.createdAt || 0,
              player1: game.player1,
              player2: game.player2,
              gameStarted: game.gameStarted
            });
          }
        });
      }

      // Fetch King of the Hill games
      const kothRef = ref(database, 'kingofthehill');
      const kothSnapshot = await get(kothRef);
      if (kothSnapshot.exists()) {
        Object.entries(kothSnapshot.val()).forEach(([code, game]) => {
          const participant = game.players?.find(p => p.uid === currentUser.uid);
          if (participant) {
            history.push({
              type: 'King of the Hill',
              code,
              date: game.createdAt || 0,
              players: game.players || [],
              gameStarted: game.gameStarted
            });
          }
        });
      }

      // Fetch Bracket Play games
      const bpRef = ref(database, 'bracketplay');
      const bpSnapshot = await get(bpRef);
      if (bpSnapshot.exists()) {
        Object.entries(bpSnapshot.val()).forEach(([code, game]) => {
          const participant = game.players?.find(p => p.uid === currentUser.uid);
          if (participant) {
            history.push({
              type: 'Bracket Play',
              code,
              date: game.createdAt || 0,
              players: game.players || [],
              gameStarted: game.gameStarted
            });
          }
        });
      }

      // Fetch Mystery Frames games
      const mfRef = ref(database, 'mysteryframes');
      const mfSnapshot = await get(mfRef);
      if (mfSnapshot.exists()) {
        Object.entries(mfSnapshot.val()).forEach(([code, game]) => {
          const participant = game.players?.find(p => p.uid === currentUser.uid);
          if (participant) {
            history.push({
              type: 'Mystery Frames',
              code,
              date: game.createdAt || 0,
              players: game.players || [],
              myWinnings: participant.totalWinnings || 0,
              gameStarted: game.gameStarted,
              currentFrame: game.currentFrame || 0
            });
          }
        });
      }

      // Sort by date (newest first)
      history.sort((a, b) => (b.date || 0) - (a.date || 0));
      setGameHistory(history);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
          style={{ color: 'rgb(148, 163, 184)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(255, 255, 255)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(148, 163, 184)'}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 items-center justify-center text-white text-2xl font-bold ${currentUser?.photoURL ? 'hidden' : 'flex'}`}>
            {currentUser?.displayName?.[0] || 'G'}
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {currentUser?.displayName || 'Guest User'}
            </h2>
            {isGuest && (
              <p className="text-amber-400 text-sm mt-1">
                Guest Account - Sign in to save stats permanently
              </p>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('stats')}
            className="px-4 py-2 rounded-lg font-semibold transition"
            style={{
              backgroundColor: view === 'stats' ? 'rgb(8, 145, 178)' : 'rgb(30, 41, 59)',
              color: view === 'stats' ? 'rgb(255, 255, 255)' : 'rgb(148, 163, 184)',
              boxShadow: view === 'stats' ? '0 10px 15px -3px rgba(6, 182, 212, 0.5)' : 'none'
            }}
          >
            <TrendingUp size={16} className="inline mr-2" />
            Statistics
          </button>
          <button
            onClick={() => setView('history')}
            className="px-4 py-2 rounded-lg font-semibold transition"
            style={{
              backgroundColor: view === 'history' ? 'rgb(8, 145, 178)' : 'rgb(30, 41, 59)',
              color: view === 'history' ? 'rgb(255, 255, 255)' : 'rgb(148, 163, 184)',
              boxShadow: view === 'history' ? '0 10px 15px -3px rgba(6, 182, 212, 0.5)' : 'none'
            }}
          >
            <History size={16} className="inline mr-2" />
            Game History ({gameHistory.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading your stats...</p>
          </div>
        ) : view === 'stats' ? (
          <div className="space-y-6">
            {/* Makes or Misses Stats */}
            <div className="bg-slate-800/50 border border-cyan-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Target size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Makes or Misses</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(34, 211, 238)' }}>{stats?.makesOrMisses?.gamesPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Games Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(74, 222, 128)' }}>{stats?.makesOrMisses?.wins || 0}</div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(248, 113, 113)' }}>{stats?.makesOrMisses?.losses || 0}</div>
                  <div className="text-sm text-slate-400">Losses</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(192, 132, 252)' }}>{stats?.makesOrMisses?.totalPoints || 0}</div>
                  <div className="text-sm text-slate-400">Total Points</div>
                </div>
              </div>
            </div>

            {/* Match Play Stats */}
            <div className="bg-slate-800/50 border border-emerald-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Trophy size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Match Play</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(52, 211, 153)' }}>{stats?.matchPlay?.gamesPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Matches Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(74, 222, 128)' }}>{stats?.matchPlay?.wins || 0}</div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(248, 113, 113)' }}>{stats?.matchPlay?.losses || 0}</div>
                  <div className="text-sm text-slate-400">Losses</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(251, 191, 36)' }}>{stats?.matchPlay?.ties || 0}</div>
                  <div className="text-sm text-slate-400">Ties</div>
                </div>
              </div>
            </div>

            {/* King of the Hill Stats */}
            <div className="bg-slate-800/50 border border-amber-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Crown size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">King of the Hill</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(251, 191, 36)' }}>{stats?.kingOfTheHill?.gamesPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Games Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(250, 204, 21)' }}>{stats?.kingOfTheHill?.highGameWins || 0}</div>
                  <div className="text-sm text-slate-400">High Game Wins</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(251, 146, 60)' }}>{stats?.kingOfTheHill?.highTotalWins || 0}</div>
                  <div className="text-sm text-slate-400">High Total Wins</div>
                </div>
              </div>
            </div>

            {/* Bracket Play Stats */}
            <div className="bg-slate-800/50 border border-violet-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Network size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Bracket Play</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(167, 139, 250)' }}>{stats?.bracketPlay?.tournamentsPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Tournaments</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(250, 204, 21)' }}>{stats?.bracketPlay?.championships || 0}</div>
                  <div className="text-sm text-slate-400">Championships</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold" style={{ color: 'rgb(203, 213, 225)' }}>{stats?.bracketPlay?.runnerUps || 0}</div>
                  <div className="text-sm text-slate-400">Runner-Ups</div>
                </div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={24} className="text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Overall Performance</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    {(stats?.makesOrMisses?.gamesPlayed || 0) +
                     (stats?.matchPlay?.gamesPlayed || 0) +
                     (stats?.kingOfTheHill?.gamesPlayed || 0) +
                     (stats?.bracketPlay?.tournamentsPlayed || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Games Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    {(stats?.makesOrMisses?.wins || 0) +
                     (stats?.matchPlay?.wins || 0) +
                     (stats?.kingOfTheHill?.highGameWins || 0) +
                     (stats?.bracketPlay?.championships || 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Wins</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Game History View */}
            {gameHistory.length === 0 ? (
              <div className="text-center py-12">
                <History size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No games found</p>
                <p className="text-slate-500 text-sm mt-2">Join or create a game to see it here!</p>
              </div>
            ) : (
              gameHistory.map((game, idx) => {
                const getGameIcon = (type) => {
                  switch(type) {
                    case 'Makes or Misses': return <Target size={20} className="text-cyan-400" />;
                    case 'Match Play': return <Trophy size={20} className="text-emerald-400" />;
                    case 'King of the Hill': return <Crown size={20} className="text-amber-400" />;
                    case 'Bracket Play': return <Network size={20} className="text-violet-400" />;
                    case 'Mystery Frames': return <Trophy size={20} className="text-orange-400" />;
                    default: return <Target size={20} />;
                  }
                };

                const getBorderColor = (type) => {
                  switch(type) {
                    case 'Makes or Misses': return 'rgb(34, 211, 238)';
                    case 'Match Play': return 'rgb(52, 211, 153)';
                    case 'King of the Hill': return 'rgb(251, 191, 36)';
                    case 'Bracket Play': return 'rgb(167, 139, 250)';
                    case 'Mystery Frames': return 'rgb(217, 119, 6)';
                    default: return 'rgb(71, 85, 105)';
                  }
                };

                return (
                  <div
                    key={idx}
                    className="bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800/70 transition"
                    style={{ border: `1px solid ${getBorderColor(game.type)}` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getGameIcon(game.type)}
                          <h3 className="font-bold text-white">{game.type}</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={14} />
                            <span>{game.date ? new Date(game.date).toLocaleDateString() : 'Unknown date'}</span>
                          </div>
                          <div className="text-slate-400">
                            Code: <span className="font-mono text-white">{game.code}</span>
                          </div>
                          {game.players && (
                            <div className="text-slate-400">
                              Players: <span className="text-white">{game.players.map(p => p.name).join(', ')}</span>
                            </div>
                          )}
                          {game.type === 'Match Play' && game.player1 && game.player2 && (
                            <div className="text-slate-400">
                              {game.player1.name} vs {game.player2.name}
                            </div>
                          )}
                          {game.type === 'Makes or Misses' && (
                            <div className="text-cyan-400 font-semibold">
                              My Score: {game.myScore} points {game.currentRound && `(Round ${game.currentRound}/50)`}
                            </div>
                          )}
                          {game.type === 'Mystery Frames' && (
                            <div className="text-orange-400 font-semibold">
                              My Winnings: ${game.myWinnings?.toFixed(2) || '0.00'} {game.currentFrame && `(Frame ${game.currentFrame})`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: game.gameStarted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                            border: `1px solid ${game.gameStarted ? 'rgb(34, 197, 94)' : 'rgb(251, 191, 36)'}`,
                            color: game.gameStarted ? 'rgb(74, 222, 128)' : 'rgb(251, 191, 36)'
                          }}
                        >
                          {game.gameStarted ? 'Started' : 'Lobby'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

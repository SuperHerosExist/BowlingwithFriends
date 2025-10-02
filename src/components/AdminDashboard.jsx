import React, { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, X, BarChart3, Target, Trophy, Crown, Network, Trash2, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { database } from '../firebase';
import { ref, get, remove, set } from 'firebase/database';

export default function AdminDashboard({ isOpen, onClose }) {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState({
    makesOrMisses: [],
    matchPlay: [],
    kingOfTheHill: [],
    bracketPlay: []
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    guestUsers: 0,
    authenticatedUsers: 0
  });
  const [view, setView] = useState('overview'); // 'overview', 'users', 'games'
  const [expandedGame, setExpandedGame] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {type: 'user'|'stats', id: string, name: string}

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchAdminData();
    }
  }, [isOpen, isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

      const usersList = Object.entries(usersData).map(([uid, data]) => ({
        uid,
        ...data
      }));

      setUsers(usersList);

      // Fetch all games
      const gamesData = {
        makesOrMisses: [],
        matchPlay: [],
        kingOfTheHill: [],
        bracketPlay: []
      };

      // Makes or Misses games
      const momRef = ref(database, 'games');
      const momSnapshot = await get(momRef);
      if (momSnapshot.exists()) {
        gamesData.makesOrMisses = Object.entries(momSnapshot.val()).map(([code, data]) => ({
          code,
          ...data
        }));
      }

      // Match Play games
      const mpRef = ref(database, 'matchplay');
      const mpSnapshot = await get(mpRef);
      if (mpSnapshot.exists()) {
        gamesData.matchPlay = Object.entries(mpSnapshot.val()).map(([code, data]) => ({
          code,
          ...data
        }));
      }

      // King of the Hill games
      const kothRef = ref(database, 'kingofthehill');
      const kothSnapshot = await get(kothRef);
      if (kothSnapshot.exists()) {
        gamesData.kingOfTheHill = Object.entries(kothSnapshot.val()).map(([code, data]) => ({
          code,
          ...data
        }));
      }

      // Bracket Play games
      const bpRef = ref(database, 'bracketplay');
      const bpSnapshot = await get(bpRef);
      if (bpSnapshot.exists()) {
        gamesData.bracketPlay = Object.entries(bpSnapshot.val()).map(([code, data]) => ({
          code,
          ...data
        }));
      }

      setGames(gamesData);

      // Calculate stats
      const guestCount = usersList.filter(u => u.isAnonymous).length;
      const totalGames =
        gamesData.makesOrMisses.length +
        gamesData.matchPlay.length +
        gamesData.kingOfTheHill.length +
        gamesData.bracketPlay.length;

      setStats({
        totalUsers: usersList.length,
        totalGames,
        guestUsers: guestCount,
        authenticatedUsers: usersList.length - guestCount
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (uid) => {
    try {
      await remove(ref(database, `users/${uid}`));
      await fetchAdminData(); // Refresh data
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const resetUserStats = async (uid, gameType = null) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();

        if (gameType) {
          // Reset specific game stats
          userData.stats[gameType] = {
            gamesPlayed: 0,
            totalPoints: 0,
            wins: 0,
            losses: 0,
            ...(gameType === 'matchPlay' && { ties: 0 }),
            ...(gameType === 'kingOfTheHill' && { highGameWins: 0, highTotalWins: 0 }),
            ...(gameType === 'bracketPlay' && { tournamentsPlayed: 0, championships: 0, runnerUps: 0 })
          };
        } else {
          // Reset all stats
          userData.stats = {
            makesOrMisses: { gamesPlayed: 0, totalPoints: 0, wins: 0, losses: 0 },
            matchPlay: { gamesPlayed: 0, wins: 0, losses: 0, ties: 0 },
            kingOfTheHill: { gamesPlayed: 0, highGameWins: 0, highTotalWins: 0 },
            bracketPlay: { tournamentsPlayed: 0, championships: 0, runnerUps: 0 }
          };
        }

        await set(userRef, userData);
        await fetchAdminData(); // Refresh data
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      alert('Failed to reset stats');
    }
  };

  const deleteGame = async (gameType, gameCode) => {
    try {
      const paths = {
        'makesOrMisses': `games/${gameCode}`,
        'matchPlay': `matchplay/${gameCode}`,
        'kingOfTheHill': `kingofthehill/${gameCode}`,
        'bracketPlay': `bracketplay/${gameCode}`
      };

      await remove(ref(database, paths[gameType]));
      await fetchAdminData(); // Refresh data
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game');
    }
  };

  const deleteAllGames = async () => {
    try {
      // Delete all game types
      await Promise.all([
        remove(ref(database, 'games')),
        remove(ref(database, 'matchplay')),
        remove(ref(database, 'kingofthehill')),
        remove(ref(database, 'bracketplay'))
      ]);

      await fetchAdminData(); // Refresh data
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting all games:', error);
      alert('Failed to delete all games');
    }
  };

  if (!isOpen) return null;
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-slate-900 border-2 border-red-700 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <Shield size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={onClose}
            className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-slate-800 border-2 border-red-600 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">
              Confirm {deleteConfirm.type === 'user' ? 'User Deletion' : deleteConfirm.type === 'bulk-games' ? 'Bulk Game Deletion' : deleteConfirm.type === 'game' ? 'Game Deletion' : 'Stats Reset'}
            </h3>
            <p className="text-slate-300 mb-6">
              {deleteConfirm.type === 'user'
                ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
                : deleteConfirm.type === 'bulk-games'
                ? `Delete ALL active games (${stats.totalGames} total)? All game data will be permanently removed. This action cannot be undone.`
                : deleteConfirm.type === 'game'
                ? `Delete game "${deleteConfirm.name}"? All game data will be permanently removed.`
                : `Reset ${deleteConfirm.gameType === 'all' ? 'all stats' : `${deleteConfirm.gameType} stats`} for "${deleteConfirm.name}"?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'user') {
                    deleteUser(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'bulk-games') {
                    deleteAllGames();
                  } else if (deleteConfirm.type === 'game') {
                    deleteGame(deleteConfirm.gameType, deleteConfirm.id);
                  } else {
                    resetUserStats(deleteConfirm.id, deleteConfirm.gameType === 'all' ? null : deleteConfirm.gameType);
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-semibold"
              >
                {deleteConfirm.type === 'game' || deleteConfirm.type === 'user' || deleteConfirm.type === 'bulk-games' ? 'Delete' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                <p className="text-slate-400 text-sm">System Overview & Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                view === 'overview'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setView('users')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                view === 'users'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Users ({stats.totalUsers})
            </button>
            <button
              onClick={() => setView('games')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                view === 'games'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp size={16} className="inline mr-2" />
              Active Games ({stats.totalGames})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading admin data...</p>
            </div>
          ) : (
            <>
              {/* Overview */}
              {view === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-cyan-700 rounded-xl p-4">
                      <div className="text-3xl font-bold text-cyan-400">{stats.totalUsers}</div>
                      <div className="text-sm text-slate-400">Total Users</div>
                    </div>
                    <div className="bg-slate-800/50 border border-green-700 rounded-xl p-4">
                      <div className="text-3xl font-bold text-green-400">{stats.authenticatedUsers}</div>
                      <div className="text-sm text-slate-400">Authenticated</div>
                    </div>
                    <div className="bg-slate-800/50 border border-amber-700 rounded-xl p-4">
                      <div className="text-3xl font-bold text-amber-400">{stats.guestUsers}</div>
                      <div className="text-sm text-slate-400">Guest Users</div>
                    </div>
                    <div className="bg-slate-800/50 border border-purple-700 rounded-xl p-4">
                      <div className="text-3xl font-bold text-purple-400">{stats.totalGames}</div>
                      <div className="text-sm text-slate-400">Active Games</div>
                    </div>
                  </div>

                  {/* Game Mode Breakdown */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Games by Mode</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <Target size={32} className="text-cyan-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">{games.makesOrMisses.length}</div>
                          <div className="text-xs text-slate-400">Makes or Misses</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Trophy size={32} className="text-emerald-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">{games.matchPlay.length}</div>
                          <div className="text-xs text-slate-400">Match Play</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Crown size={32} className="text-amber-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">{games.kingOfTheHill.length}</div>
                          <div className="text-xs text-slate-400">King of the Hill</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Network size={32} className="text-violet-400" />
                        <div>
                          <div className="text-2xl font-bold text-white">{games.bracketPlay.length}</div>
                          <div className="text-xs text-slate-400">Bracket Play</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users View */}
              {view === 'users' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-900/50 border-b border-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Joined</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Total Games</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {users.map((user) => {
                          const totalGamesPlayed =
                            (user.stats?.makesOrMisses?.gamesPlayed || 0) +
                            (user.stats?.matchPlay?.gamesPlayed || 0) +
                            (user.stats?.kingOfTheHill?.gamesPlayed || 0) +
                            (user.stats?.bracketPlay?.tournamentsPlayed || 0);

                          return (
                            <tr key={user.uid} className="hover:bg-slate-800/30">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {user.photoURL ? (
                                    <img
                                      src={user.photoURL}
                                      alt=""
                                      className="w-8 h-8 rounded-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 items-center justify-center text-white text-sm font-bold ${user.photoURL ? 'hidden' : 'flex'}`}>
                                    {user.displayName?.[0] || 'G'}
                                  </div>
                                  <span className="text-white font-medium">{user.displayName || 'Guest User'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-sm">{user.email || '-'}</td>
                              <td className="px-4 py-3">
                                {user.isAnonymous ? (
                                  <span className="px-2 py-1 bg-amber-900/30 border border-amber-700 rounded text-amber-400 text-xs font-semibold">
                                    Guest
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-900/30 border border-green-700 rounded text-green-400 text-xs font-semibold">
                                    Authenticated
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-sm">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-white font-semibold">{totalGamesPlayed}</td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'stats', id: user.uid, name: user.displayName || 'User', gameType: 'all' })}
                                    className="p-2 bg-amber-900/30 border border-amber-700 rounded hover:bg-amber-900/50 transition"
                                    title="Reset All Stats"
                                  >
                                    <RefreshCw size={14} className="text-amber-400" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm({ type: 'user', id: user.uid, name: user.displayName || 'User' })}
                                    className="p-2 bg-red-900/30 border border-red-700 rounded hover:bg-red-900/50 transition"
                                    title="Delete User"
                                  >
                                    <Trash2 size={14} className="text-red-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Games View */}
              {view === 'games' && (
                <div className="space-y-6">
                  {/* Bulk Delete Header */}
                  {stats.totalGames > 0 && (
                    <div className="flex justify-between items-center bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">All Active Games</h3>
                        <p className="text-slate-400 text-sm">Total: {stats.totalGames} games</p>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'bulk-games', id: 'all', name: 'all games' })}
                        className="px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 transition flex items-center gap-2 text-red-400 font-semibold"
                      >
                        <Trash2 size={18} />
                        Delete All Games
                      </button>
                    </div>
                  )}
                  {/* Makes or Misses */}
                  {games.makesOrMisses.length > 0 && (
                    <div className="bg-slate-800/50 border border-cyan-700 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Target size={20} className="text-cyan-400" />
                        Makes or Misses ({games.makesOrMisses.length})
                      </h3>
                      <div className="grid gap-2">
                        {games.makesOrMisses.map((game) => {
                          const isExpanded = expandedGame === `mom-${game.code}`;
                          return (
                            <div key={game.code} className="bg-slate-900/50 rounded-lg overflow-hidden">
                              <div
                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-800/50"
                                onClick={() => setExpandedGame(isExpanded ? null : `mom-${game.code}`)}
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronUp size={16} className="text-cyan-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                  <span className="text-white font-mono font-semibold">{game.code}</span>
                                  <span className="text-slate-400 text-sm ml-3">
                                    {game.players?.length || 0} players • Round {game.currentRound || 0}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {game.createdAt ? new Date(game.createdAt).toLocaleString() : '-'}
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700">
                                  <h4 className="font-semibold text-white mb-2">Players & Scores</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {game.players?.map((player, idx) => (
                                      <div key={player.id || idx} className="flex justify-between bg-slate-900/50 px-3 py-2 rounded">
                                        <span className="text-slate-300">{player.name}</span>
                                        <span className="text-cyan-400 font-semibold">{player.score || 0} pts</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-slate-400">Status:</span>
                                      <span className="ml-2 text-white">{game.gameStarted ? 'In Progress' : 'Waiting'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Active Player:</span>
                                      <span className="ml-2 text-white">{game.players?.[game.activePlayerIndex]?.name || '-'}</span>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({ type: 'game', id: game.code, name: game.code, gameType: 'makesOrMisses' });
                                      }}
                                      className="px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 transition flex items-center gap-2 text-red-400 font-semibold"
                                    >
                                      <Trash2 size={16} />
                                      Delete Game
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Match Play */}
                  {games.matchPlay.length > 0 && (
                    <div className="bg-slate-800/50 border border-emerald-700 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Trophy size={20} className="text-emerald-400" />
                        Match Play ({games.matchPlay.length})
                      </h3>
                      <div className="grid gap-2">
                        {games.matchPlay.map((game) => {
                          const isExpanded = expandedGame === `matchPlay-${game.code}`;
                          return (
                            <div key={game.code} className="bg-slate-900/50 rounded-lg overflow-hidden">
                              <div
                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-900/70 transition"
                                onClick={() => setExpandedGame(isExpanded ? null : `matchPlay-${game.code}`)}
                              >
                                <div>
                                  <span className="text-white font-mono font-semibold">{game.code}</span>
                                  <span className="text-slate-400 text-sm ml-3">
                                    {game.player1?.name || 'Player 1'} vs {game.player2?.name || 'Player 2'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-slate-500">
                                    {game.createdAt ? new Date(game.createdAt).toLocaleString() : '-'}
                                  </div>
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700">
                                  <h4 className="font-semibold text-white mb-2">Match Details</h4>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-900/50 p-3 rounded-lg">
                                      <div className="text-sm text-slate-400 mb-1">Player 1</div>
                                      <div className="text-white font-semibold">{game.player1?.name || 'Not joined'}</div>
                                      <div className="text-emerald-400 text-sm mt-1">{game.player1?.score || 0} points</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg">
                                      <div className="text-sm text-slate-400 mb-1">Player 2</div>
                                      <div className="text-white font-semibold">{game.player2?.name || 'Not joined'}</div>
                                      <div className="text-emerald-400 text-sm mt-1">{game.player2?.score || 0} points</div>
                                    </div>
                                  </div>
                                  {game.currentRound && (
                                    <div className="text-sm text-slate-400 mb-4">
                                      Round: {game.currentRound} / 10
                                    </div>
                                  )}
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({
                                          type: 'game',
                                          id: game.code,
                                          name: game.code,
                                          gameType: 'matchPlay'
                                        });
                                      }}
                                      className="px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 transition flex items-center gap-2 text-red-400 font-semibold"
                                    >
                                      <Trash2 size={16} />
                                      Delete Game
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* King of the Hill */}
                  {games.kingOfTheHill.length > 0 && (
                    <div className="bg-slate-800/50 border border-amber-700 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Crown size={20} className="text-amber-400" />
                        King of the Hill ({games.kingOfTheHill.length})
                      </h3>
                      <div className="grid gap-2">
                        {games.kingOfTheHill.map((game) => {
                          const isExpanded = expandedGame === `kingOfTheHill-${game.code}`;
                          return (
                            <div key={game.code} className="bg-slate-900/50 rounded-lg overflow-hidden">
                              <div
                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-900/70 transition"
                                onClick={() => setExpandedGame(isExpanded ? null : `kingOfTheHill-${game.code}`)}
                              >
                                <div>
                                  <span className="text-white font-mono font-semibold">{game.code}</span>
                                  <span className="text-slate-400 text-sm ml-3">
                                    {game.players?.length || 0} players
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-slate-500">
                                    {game.createdAt ? new Date(game.createdAt).toLocaleString() : '-'}
                                  </div>
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700">
                                  <h4 className="font-semibold text-white mb-2">Players & Scores</h4>
                                  <div className="grid grid-cols-2 gap-2 mb-4">
                                    {game.players?.map((player, idx) => (
                                      <div key={player.id || idx} className="bg-slate-900/50 p-2 rounded flex justify-between items-center">
                                        <span className="text-white text-sm">{player.name}</span>
                                        <span className="text-amber-400 font-semibold text-sm">{player.score || 0} pts</span>
                                      </div>
                                    ))}
                                  </div>
                                  {game.currentRound && (
                                    <div className="text-sm text-slate-400 mb-4">
                                      Round: {game.currentRound}
                                    </div>
                                  )}
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({
                                          type: 'game',
                                          id: game.code,
                                          name: game.code,
                                          gameType: 'kingOfTheHill'
                                        });
                                      }}
                                      className="px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 transition flex items-center gap-2 text-red-400 font-semibold"
                                    >
                                      <Trash2 size={16} />
                                      Delete Game
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bracket Play */}
                  {games.bracketPlay.length > 0 && (
                    <div className="bg-slate-800/50 border border-violet-700 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <Network size={20} className="text-violet-400" />
                        Bracket Play ({games.bracketPlay.length})
                      </h3>
                      <div className="grid gap-2">
                        {games.bracketPlay.map((game) => {
                          const isExpanded = expandedGame === `bracketPlay-${game.code}`;
                          return (
                            <div key={game.code} className="bg-slate-900/50 rounded-lg overflow-hidden">
                              <div
                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-900/70 transition"
                                onClick={() => setExpandedGame(isExpanded ? null : `bracketPlay-${game.code}`)}
                              >
                                <div>
                                  <span className="text-white font-mono font-semibold">{game.code}</span>
                                  <span className="text-slate-400 text-sm ml-3">
                                    {game.players?.length || 0} players
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-slate-500">
                                    {game.createdAt ? new Date(game.createdAt).toLocaleString() : '-'}
                                  </div>
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700">
                                  <h4 className="font-semibold text-white mb-2">Players & Standings</h4>
                                  <div className="grid grid-cols-2 gap-2 mb-4">
                                    {game.players?.map((player, idx) => (
                                      <div key={player.id || idx} className="bg-slate-900/50 p-2 rounded flex justify-between items-center">
                                        <span className="text-white text-sm">{player.name}</span>
                                        <span className="text-violet-400 font-semibold text-sm">{player.wins || 0} wins</span>
                                      </div>
                                    ))}
                                  </div>
                                  {game.currentRound && (
                                    <div className="text-sm text-slate-400 mb-4">
                                      Round: {game.currentRound}
                                    </div>
                                  )}
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({
                                          type: 'game',
                                          id: game.code,
                                          name: game.code,
                                          gameType: 'bracketPlay'
                                        });
                                      }}
                                      className="px-4 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 transition flex items-center gap-2 text-red-400 font-semibold"
                                    >
                                      <Trash2 size={16} />
                                      Delete Game
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {stats.totalGames === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No active games</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

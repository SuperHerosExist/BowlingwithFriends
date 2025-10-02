import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, Users, Crown, Network, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';

export default function UserStats({ isOpen, onClose }) {
  const { currentUser, isGuest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserStats();
    }
  }, [isOpen, currentUser]);

  const fetchUserStats = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading your stats...</p>
          </div>
        ) : (
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
                  <div className="text-2xl font-bold text-cyan-400">{stats?.makesOrMisses?.gamesPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Games Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{stats?.makesOrMisses?.wins || 0}</div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{stats?.makesOrMisses?.losses || 0}</div>
                  <div className="text-sm text-slate-400">Losses</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{stats?.makesOrMisses?.totalPoints || 0}</div>
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
                  <div className="text-2xl font-bold text-emerald-400">{stats?.matchPlay?.gamesPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Matches Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{stats?.matchPlay?.wins || 0}</div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{stats?.matchPlay?.losses || 0}</div>
                  <div className="text-sm text-slate-400">Losses</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{stats?.matchPlay?.ties || 0}</div>
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
                  <div className="text-2xl font-bold text-amber-400">{stats?.kingOfTheHill?.gamesPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Games Played</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{stats?.kingOfTheHill?.highGameWins || 0}</div>
                  <div className="text-sm text-slate-400">High Game Wins</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400">{stats?.kingOfTheHill?.highTotalWins || 0}</div>
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
                  <div className="text-2xl font-bold text-violet-400">{stats?.bracketPlay?.tournamentsPlayed || 0}</div>
                  <div className="text-sm text-slate-400">Tournaments</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{stats?.bracketPlay?.championships || 0}</div>
                  <div className="text-sm text-slate-400">Championships</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-400">{stats?.bracketPlay?.runnerUps || 0}</div>
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
        )}
      </div>
    </div>
  );
}

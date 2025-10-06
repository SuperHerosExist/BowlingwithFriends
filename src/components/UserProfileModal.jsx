import React, { useState, useEffect } from 'react';
import { X, User, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';

export default function UserProfileModal({ isOpen, onClose, onOpenStats }) {
  const { currentUser, isGuest } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserProfile();
    }
  }, [isOpen, currentUser]);

  const fetchUserProfile = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setUserProfile(snapshot.val());
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
          style={{ color: 'rgb(148, 163, 184)' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
              {currentUser?.displayName?.[0] || 'G'}
            </div>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {currentUser?.displayName || 'Guest User'}
            </h2>
            <p className="text-slate-400 text-sm">{currentUser?.email || 'Guest Account'}</p>
            {isGuest && (
              <p className="text-amber-400 text-xs mt-1">
                Sign in to unlock all features
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenStats();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl p-4 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold">View Stats & History</div>
                    <div className="text-slate-400 text-sm">See your performance across all games</div>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-white transition">→</div>
              </button>
            </div>

            {/* Account Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Account Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Type:</span>
                  <span className="text-white font-semibold">{isGuest ? 'Guest' : 'Authenticated'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since:</span>
                  <span className="text-white">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Games:</span>
                  <span className="text-white font-semibold">
                    {(userProfile?.stats?.makesOrMisses?.gamesPlayed || 0) +
                     (userProfile?.stats?.matchPlay?.gamesPlayed || 0) +
                     (userProfile?.stats?.kingOfTheHill?.gamesPlayed || 0) +
                     (userProfile?.stats?.bracketPlay?.tournamentsPlayed || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

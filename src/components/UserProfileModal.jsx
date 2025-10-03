import React, { useState, useEffect } from 'react';
import { X, User, TrendingUp, ShoppingCart, Crown, Coins, Zap, History } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import CreditsModal from './CreditsModal';
import SubscriptionModal from './SubscriptionModal';

export default function UserProfileModal({ isOpen, onClose, onOpenStats }) {
  const { currentUser, isGuest } = useAuth();
  const [view, setView] = useState('profile'); // 'profile', 'purchase'
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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

  const credits = userProfile?.credits || 0;
  const subscription = userProfile?.subscription;
  const hasActiveSubscription = subscription?.isActive && subscription?.endDate && Date.now() < subscription.endDate;

  return (
    <>
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('profile')}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              style={{
                backgroundColor: view === 'profile' ? 'rgb(8, 145, 178)' : 'rgba(30, 41, 59, 0.5)',
                color: 'rgb(255, 255, 255)',
                border: view === 'profile' ? 'none' : '1px solid rgb(71, 85, 105)',
                boxShadow: view === 'profile' ? '0 10px 15px -3px rgba(6, 182, 212, 0.5)' : 'none'
              }}
            >
              <User size={16} />
              Profile
            </button>
            <button
              onClick={() => setView('purchase')}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              style={{
                backgroundColor: view === 'purchase' ? 'rgb(8, 145, 178)' : 'rgba(30, 41, 59, 0.5)',
                color: 'rgb(255, 255, 255)',
                border: view === 'purchase' ? 'none' : '1px solid rgb(71, 85, 105)',
                boxShadow: view === 'purchase' ? '0 10px 15px -3px rgba(6, 182, 212, 0.5)' : 'none'
              }}
            >
              <ShoppingCart size={16} />
              Get Premium
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading...</p>
            </div>
          ) : view === 'profile' ? (
            <div className="space-y-6">
              {/* Account Balance */}
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Coins size={20} className="text-yellow-400" />
                  Account Balance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-yellow-400">{credits}</div>
                    <div className="text-sm text-slate-400">Credits</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">Premium Status</div>
                    {hasActiveSubscription ? (
                      <div>
                        <div className="text-purple-400 font-bold">✓ Active</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Until {new Date(subscription.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 font-semibold">No subscription</div>
                    )}
                  </div>
                </div>
              </div>

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

                <button
                  onClick={() => setView('purchase')}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl p-4 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Crown size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-semibold">Get Premium</div>
                      <div className="text-slate-400 text-sm">Buy credits or remove ads</div>
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
          ) : (
            <div className="space-y-6">
              {/* Premium Options */}
              <div className="space-y-4">
                {/* Credits */}
                <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-2 border-yellow-600 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Coins size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Buy Credits</h3>
                      <p className="text-slate-400 text-sm">One-time purchase, use anytime</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-4">
                    Credits unlock premium game modes and special features. Choose from various credit packs starting at just $1!
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      setShowCreditsModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <Coins size={20} />
                    View Credit Packs
                  </button>
                </div>

                {/* Subscription */}
                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-600 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Crown size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Premium Subscription</h3>
                      <p className="text-slate-400 text-sm">Remove all ads forever</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Zap size={16} className="text-purple-400" />
                      <span>Ad-free experience across all games</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Zap size={16} className="text-purple-400" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Zap size={16} className="text-purple-400" />
                      <span>Exclusive features coming soon</span>
                    </div>
                  </div>
                  {hasActiveSubscription ? (
                    <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4 text-center">
                      <div className="text-purple-400 font-bold mb-1">✓ You're Premium!</div>
                      <div className="text-slate-400 text-sm">
                        Active until {new Date(subscription.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        setShowSubscriptionModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
                    >
                      <Crown size={20} />
                      View Subscription Plans
                    </button>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Why Go Premium?</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-cyan-400 font-bold mb-1">Credits</div>
                    <div className="text-slate-400">Unlock exclusive game modes</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-purple-400 font-bold mb-1">Ad-Free</div>
                    <div className="text-slate-400">Uninterrupted gameplay</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-green-400 font-bold mb-1">Support</div>
                    <div className="text-slate-400">Keep the app running</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-orange-400 font-bold mb-1">More Features</div>
                    <div className="text-slate-400">Coming soon!</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credits Modal */}
      <CreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        user={currentUser}
        currentCredits={credits}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        user={currentUser}
      />
    </>
  );
}

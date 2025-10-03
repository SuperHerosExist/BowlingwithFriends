import React, { useState, useEffect, useRef } from 'react';
import { Target, Dices, Trophy, ArrowLeft, Crown, Network, Sparkles, Zap, User, LogOut, BarChart3, Shield, Upload, Lock } from 'lucide-react';
import MakesOrMisses from './games/MakesorMisses';
import MatchPlay from './games/MatchPlay';
import KingOfTheHill from './games/KingOfTheHill';
import BracketPlay from './games/BracketPlay';
import MysteryFrames from './games/MysteryFrames';
import { useAuth } from './AuthContext';
import AuthModal from './components/AuthModal';
import UserStats from './components/UserStats';
import UserProfileModal from './components/UserProfileModal';
import AdminDashboard from './components/AdminDashboard';
import TopBowlers from './components/TopBowlers';
import ScoreImport from './components/ScoreImport';
import AdBanner from './components/AdBanner';
import RewardedAd from './components/RewardedAd';
import SubscriptionModal from './components/SubscriptionModal';
import CreditsModal from './components/CreditsModal';
import UnlockGameModal from './components/UnlockGameModal';
import { useUserPayment } from './hooks/useUserPayment';

export default function GamesLanding() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [hoveredGame, setHoveredGame] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTopBowlers, setShowTopBowlers] = useState(false);
  const [showScoreImport, setShowScoreImport] = useState(false);
  const [showGuestRestrictionModal, setShowGuestRestrictionModal] = useState(false);
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [rewardedGameName, setRewardedGameName] = useState('');
  const [adUnlockedGames, setAdUnlockedGames] = useState(() => {
    // Load from localStorage
    const stored = localStorage.getItem('adUnlockedGames');
    return stored ? JSON.parse(stored) : {};
  });
  const [pendingJoin, setPendingJoin] = useState(null); // {gameId, joinCode}
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false); // Modal showing unlock options
  const [pendingGameId, setPendingGameId] = useState(null); // Game user wants to unlock with credits

  const { currentUser, isGuest, isAdmin, signOut } = useAuth();
  const { credits, hasActiveSubscription, shouldShowAds, spendCredits } = useUserPayment(currentUser?.uid);
  const userMenuRef = useRef(null);

  // Check URL parameters for join invitation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    const gameParam = urlParams.get('game');

    if (joinCode && gameParam) {
      // Store pending join info
      setPendingJoin({ gameId: gameParam, joinCode: joinCode.toUpperCase() });

      // If guest or not logged in, show auth modal
      if (!currentUser || isGuest) {
        setShowAuthModal(true);
      } else {
        // User is authenticated, proceed to game
        setSelectedGame(gameParam);
      }
    }
  }, [currentUser, isGuest]);

  // After authentication, process pending join
  useEffect(() => {
    if (pendingJoin && currentUser && !isGuest) {
      setSelectedGame(pendingJoin.gameId);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, isGuest, pendingJoin]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const games = [
    {
      id: 'makes-or-misses',
      name: 'Makes or Misses',
      description: 'Predict if you make or miss the next shot',
      icon: Target,
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
      glowColor: 'shadow-cyan-500/50',
      badge: '🎯 Quick Play',
      available: true
    },
    {
      id: 'match-play',
      name: 'Match Play',
      description: 'Head-to-head 3-game match',
      icon: Trophy,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      glowColor: 'shadow-emerald-500/50',
      badge: '⚡ 1v1 Battle',
      available: true
    },
    {
      id: 'king-of-the-hill',
      name: 'King of the Hill',
      description: 'High game takes it all',
      icon: Crown,
      gradient: 'from-amber-500 via-orange-500 to-red-600',
      glowColor: 'shadow-amber-500/50',
      badge: '👑 Multiplayer',
      available: true
    },
    {
      id: 'bracket-play',
      name: 'Bracket Play',
      description: '8-player single elimination bracket',
      icon: Network,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      glowColor: 'shadow-violet-500/50',
      badge: '🏆 Tournament',
      available: true
    },
    {
      id: 'mystery-frames',
      name: 'Mystery Frames',
      description: 'Quarters game with strike-based mystery bonuses',
      icon: Zap,
      gradient: 'from-amber-500 via-yellow-500 to-orange-600',
      glowColor: 'shadow-amber-500/50',
      badge: '⚡ Quarters + Bonus',
      available: true
    }
  ];

  const handleGameSelect = (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (!game.available) return;

    // Free game - always accessible
    if (gameId === 'makes-or-misses') {
      setSelectedGame(gameId);
      return;
    }

    // Subscribed users - full access
    if (hasActiveSubscription) {
      setSelectedGame(gameId);
      return;
    }

    // Guest users - must watch ad or upgrade
    if (isGuest) {
      // Check if game is unlocked by watching ad
      const unlockExpiry = adUnlockedGames[gameId];
      const isUnlockedByAd = unlockExpiry && Date.now() < unlockExpiry;

      if (isUnlockedByAd) {
        setSelectedGame(gameId);
        return;
      }

      // Offer ad unlock or upgrade
      setRewardedGameName(game.name);
      setShowRewardedAd(true);
      return;
    }

    // Registered users without subscription - can use credits
    // Show options: watch ad, use credits, or subscribe
    setPendingGameId(gameId);
    setShowUnlockModal(true);
  };

  const handleAdRewardGranted = () => {
    // Unlock all games for 24 hours
    const unlockTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    const unlocked = {
      'match-play': unlockTime,
      'king-of-the-hill': unlockTime,
      'bracket-play': unlockTime,
      'mystery-frames': unlockTime
    };
    setAdUnlockedGames(unlocked);
    localStorage.setItem('adUnlockedGames', JSON.stringify(unlocked));

    // Show guest restriction modal with success message
    setShowGuestRestrictionModal(true);
  };

  const handleUnlockWithCredits = async () => {
    if (!pendingGameId) return;

    const success = await spendCredits(1);
    if (success) {
      setShowUnlockModal(false);
      setSelectedGame(pendingGameId);
      setPendingGameId(null);
    } else {
      alert('Unable to unlock game. Please buy more credits.');
    }
  };

  const handleUnlockModalWatchAd = () => {
    setShowUnlockModal(false);
    const game = games.find(g => g.id === pendingGameId);
    setRewardedGameName(game?.name || '');
    setShowRewardedAd(true);
  };

  const handleUnlockModalBuyCredits = () => {
    setShowUnlockModal(false);
    setShowCreditsModal(true);
  };

  const handleUnlockModalSubscribe = () => {
    setShowUnlockModal(false);
    setShowSubscriptionModal(true);
  };

  const handleBackToMenu = () => {
    setSelectedGame(null);
  };

  // If a game is selected, render it
  if (selectedGame === 'makes-or-misses') {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 z-50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <MakesOrMisses />
      </div>
    );
  }

  if (selectedGame === 'match-play') {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <MatchPlay />
      </div>
    );
  }

  if (selectedGame === 'king-of-the-hill') {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <KingOfTheHill />
      </div>
    );
  }

  if (selectedGame === 'bracket-play') {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 z-50 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-2xl hover:shadow-violet-500/50 hover:scale-105 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <BracketPlay />
      </div>
    );
  }

  if (selectedGame === 'mystery-frames') {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={handleBackToMenu}
          className="fixed top-6 left-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-xl shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <MysteryFrames />
      </div>
    );
  }

  // Landing page
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      {/* User Profile Button - Top Right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 md:gap-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full px-3 py-2 md:px-4 hover:bg-slate-800 transition"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 items-center justify-center ${currentUser?.photoURL ? 'hidden' : 'flex'}`}>
              <User size={20} className="text-white" />
            </div>
            <span className="text-white font-semibold text-sm md:text-base hidden sm:inline">
              {currentUser?.displayName || 'Guest'}
              {isGuest && <span className="text-slate-400 text-sm ml-1">(Guest)</span>}
            </span>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              className="absolute top-full right-0 mt-2 w-56 sm:w-64 rounded-xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
                borderColor: 'rgba(51, 65, 85, 0.5)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.2)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {isGuest && (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left transition flex items-center gap-3"
                  style={{
                    color: 'rgb(34, 211, 238)',
                    backgroundColor: 'transparent',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User size={18} />
                  Sign In / Register
                </button>
              )}
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-3 text-left transition flex items-center gap-3"
                style={{
                  color: 'rgb(241, 245, 249)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User size={18} />
                My Profile
              </button>
              <button
                onClick={() => {
                  setShowStats(true);
                  setShowUserMenu(false);
                }}
                className="w-full px-4 py-3 text-left transition flex items-center gap-3"
                style={{
                  color: 'rgb(241, 245, 249)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <BarChart3 size={18} />
                View Stats
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAdmin(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left transition flex items-center gap-3"
                  style={{
                    color: 'rgb(192, 132, 252)',
                    backgroundColor: 'transparent',
                    borderTop: '1px solid rgba(51, 65, 85, 0.5)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Shield size={18} />
                  Admin Dashboard
                </button>
              )}
              {!isGuest && (
                <button
                  onClick={async () => {
                    await signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left transition flex items-center gap-3"
                  style={{
                    color: 'rgb(248, 113, 113)',
                    backgroundColor: 'transparent',
                    borderTop: '1px solid rgba(51, 65, 85, 0.5)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        pendingInvite={pendingJoin}
      />

      {/* Guest Restriction Modal */}
      {showGuestRestrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGuestRestrictionModal(false)}></div>
          <div className="relative bg-slate-900 border-2 border-purple-500 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Register to Play</h2>
            <p className="text-slate-300 mb-6">
              Guest accounts can only access <span className="text-cyan-400 font-semibold">Makes or Misses</span>.
              Sign up for a free account to unlock all game modes and track your stats!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowGuestRestrictionModal(false);
                  setShowAuthModal(true);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowGuestRestrictionModal(false)}
                className="flex-1 bg-slate-800 text-slate-300 font-semibold py-3 px-4 rounded-lg hover:bg-slate-700 transition border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenStats={() => setShowStats(true)}
      />

      {/* User Stats Modal */}
      <UserStats isOpen={showStats} onClose={() => setShowStats(false)} />

      {/* Admin Dashboard Modal */}
      <AdminDashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

      {/* Top Bowlers Modal */}
      <TopBowlers isOpen={showTopBowlers} onClose={() => setShowTopBowlers(false)} />

      {/* Score Import Modal */}
      <ScoreImport isOpen={showScoreImport} onClose={() => setShowScoreImport(false)} />

      {/* Rewarded Ad Modal */}
      <RewardedAd
        isOpen={showRewardedAd}
        onClose={() => setShowRewardedAd(false)}
        onRewardGranted={handleAdRewardGranted}
        gameName={rewardedGameName}
      />

      {/* Unlock Game Modal */}
      <UnlockGameModal
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          setPendingGameId(null);
        }}
        gameName={games.find(g => g.id === pendingGameId)?.name || ''}
        userCredits={credits}
        onUseCredit={handleUnlockWithCredits}
        onBuyCredits={handleUnlockModalBuyCredits}
        onSubscribe={handleUnlockModalSubscribe}
        onWatchAd={handleUnlockModalWatchAd}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        user={currentUser}
      />

      {/* Credits Modal */}
      <CreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        user={currentUser}
        currentCredits={credits}
      />

      <div className="relative z-10 min-h-screen p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16 space-y-4 pt-16 sm:pt-0">
            <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full px-4 md:px-6 py-2 mb-4">
              <Sparkles className="text-purple-400" size={16} />
              <span className="text-purple-300 text-xs md:text-sm font-semibold tracking-wide">MULTIPLAYER BOWLING GAMES</span>
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 tracking-tight">
              BOWLING FUN
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Choose your battleground and dominate the lanes with friends
            </p>
          </div>

          {/* Game Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
            {games.map((game) => {
              const Icon = game.icon;
              const isHovered = hoveredGame === game.id;
              const isLocked = isGuest && game.id !== 'makes-or-misses';

              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  onMouseEnter={() => setHoveredGame(game.id)}
                  onMouseLeave={() => setHoveredGame(null)}
                  disabled={!game.available}
                  className={`group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 transition-all duration-500 ${
                    game.available
                      ? 'hover:scale-105 hover:border-slate-700 cursor-pointer hover:shadow-2xl'
                      : 'opacity-40 cursor-not-allowed'
                  } ${isLocked ? 'opacity-60' : ''}`}
                >
                  {/* Glow Effect */}
                  {isHovered && game.available && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${game.gradient} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500`}></div>
                  )}

                  <div className="relative z-10">
                    {/* Badge - Centered */}
                    <div className="flex justify-center mb-2">
                      <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                        {game.badge}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className={`relative w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center transform ${
                      game.available ? 'group-hover:scale-110 group-hover:rotate-6' : ''
                    } transition-all duration-500 shadow-lg ${isHovered ? game.glowColor + ' shadow-2xl' : ''}`}>
                      <Icon size={32} className="text-white" />
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                          <Lock size={24} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                      {game.name}
                    </h2>

                    {/* Description */}
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                      {game.description}
                    </p>

                    {/* CTA Button */}
                    {game.available ? (
                      <div className={`flex items-center justify-center gap-2 bg-gradient-to-r ${game.gradient} px-4 py-2.5 rounded-lg text-white text-sm font-bold shadow-lg transform group-hover:shadow-xl transition-all duration-300`}>
                        <Zap size={16} />
                        <span>PLAY NOW</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-500 px-4 py-2.5 rounded-lg text-sm font-semibold">
                        🔒 Coming Soon
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Top Bowlers Card */}
            <button
              onClick={() => setShowTopBowlers(true)}
              onMouseEnter={() => setHoveredGame('top-bowlers')}
              onMouseLeave={() => setHoveredGame(null)}
              className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:border-slate-700 cursor-pointer hover:shadow-2xl"
            >
              {/* Glow Effect */}
              {hoveredGame === 'top-bowlers' && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              )}

              <div className="relative z-10">
                {/* Badge */}
                <div className="flex justify-center mb-2">
                  <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                    🏆 Leaderboard
                  </div>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg hover:shadow-amber-500/50 hover:shadow-2xl">
                  <Trophy size={32} className="text-white" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                  Check Scores
                </h2>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Weekly leaderboard from your bowling center
                </p>

                {/* CTA Button */}
                <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 px-4 py-2.5 rounded-lg text-white text-sm font-bold shadow-lg transform group-hover:shadow-xl transition-all duration-300">
                  <Sparkles size={16} />
                  <span>VIEW LEADERS</span>
                </div>
              </div>
            </button>

            {/* Import Scores Card - Only show if logged in */}
            {currentUser && !isGuest && (
              <button
                onClick={() => setShowScoreImport(true)}
                onMouseEnter={() => setHoveredGame('import-scores')}
                onMouseLeave={() => setHoveredGame(null)}
                className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:border-slate-700 cursor-pointer hover:shadow-2xl"
              >
                {/* Glow Effect */}
                {hoveredGame === 'import-scores' && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                )}

                <div className="relative z-10">
                  {/* Badge */}
                  <div className="flex justify-center mb-2">
                    <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                      📊 Track Stats
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg hover:shadow-blue-500/50 hover:shadow-2xl">
                    <Upload size={32} className="text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                    Import Scores
                  </h2>

                  {/* Description */}
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Add your completed game scores
                  </p>

                  {/* CTA Button */}
                  <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-4 py-2.5 rounded-lg text-white text-sm font-bold shadow-lg transform group-hover:shadow-xl transition-all duration-300">
                    <Upload size={16} />
                    <span>ADD SCORES</span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Ad Banner - Show for users without subscription */}
          {shouldShowAds && (
            <div className="mt-12 mb-6">
              <AdBanner slot="1234567890" format="horizontal" responsive={true} />
            </div>
          )}

          {/* Footer Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-8 py-4">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">5</div>
              <div className="text-slate-500 text-sm font-semibold">Game Modes</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-8 py-4">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">∞</div>
              <div className="text-slate-500 text-sm font-semibold">Multiplayer Fun</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-8 py-4">
              <div className="text-3xl font-bold">🎳</div>
              <div className="text-slate-500 text-sm font-semibold">Real-Time Sync</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
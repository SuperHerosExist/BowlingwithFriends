import React, { useState } from 'react';
import { Target, Dices, Trophy, ArrowLeft, Crown, Network, Sparkles, Zap, User, LogOut, BarChart3, Shield, Upload } from 'lucide-react';
import MakesOrMisses from './games/MakesorMisses';
import MatchPlay from './games/MatchPlay';
import KingOfTheHill from './games/KingOfTheHill';
import BracketPlay from './games/BracketPlay';
import { useAuth } from './AuthContext';
import AuthModal from './components/AuthModal';
import UserStats from './components/UserStats';
import AdminDashboard from './components/AdminDashboard';
import TopBowlers from './components/TopBowlers';
import ScoreImport from './components/ScoreImport';

export default function GamesLanding() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [hoveredGame, setHoveredGame] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTopBowlers, setShowTopBowlers] = useState(false);
  const [showScoreImport, setShowScoreImport] = useState(false);

  const { currentUser, isGuest, isAdmin, signOut } = useAuth();

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
    }
  ];

  const handleGameSelect = (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (game.available) {
      setSelectedGame(gameId);
    }
  };

  const handleBackToMenu = () => {
    setSelectedGame(null);
  };

  // If a game is selected, render it
  if (selectedGame === 'makes-or-misses') {
    return (
      <div className="relative">
        <button
          onClick={handleBackToMenu}
          className="absolute top-4 left-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition flex items-center gap-2 font-semibold"
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
      <div className="relative">
        <button
          onClick={handleBackToMenu}
          className="absolute top-4 left-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition flex items-center gap-2 font-semibold"
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
      <div className="relative">
        <button
          onClick={handleBackToMenu}
          className="absolute top-4 left-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition flex items-center gap-2 font-semibold"
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
      <div className="relative">
        <button
          onClick={handleBackToMenu}
          className="absolute top-4 left-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition flex items-center gap-2 font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <BracketPlay />
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
      <div className="absolute top-6 right-6 z-20">
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 hover:bg-slate-800 transition"
            >
              {currentUser.photoURL ? (
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
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 items-center justify-center ${currentUser.photoURL ? 'hidden' : 'flex'}`}>
                <User size={20} className="text-white" />
              </div>
              <span className="text-white font-semibold">
                {currentUser.displayName || 'Guest'}
                {isGuest && <span className="text-slate-400 text-sm ml-1">(Guest)</span>}
              </span>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
                <button
                  onClick={() => {
                    setShowStats(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-slate-800 transition flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left text-purple-400 hover:bg-slate-800 transition flex items-center gap-3 border-t border-slate-800"
                  >
                    <Shield size={18} />
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-slate-800 transition flex items-center gap-3 border-t border-slate-800"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold px-6 py-2 rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition flex items-center gap-2"
          >
            <User size={20} />
            Sign In
          </button>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* User Stats Modal */}
      <UserStats isOpen={showStats} onClose={() => setShowStats(false)} />

      {/* Admin Dashboard Modal */}
      <AdminDashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

      {/* Top Bowlers Modal */}
      <TopBowlers isOpen={showTopBowlers} onClose={() => setShowTopBowlers(false)} />

      {/* Score Import Modal */}
      <ScoreImport isOpen={showScoreImport} onClose={() => setShowScoreImport(false)} />

      <div className="relative z-10 min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full px-6 py-2 mb-4">
              <Sparkles className="text-purple-400" size={18} />
              <span className="text-purple-300 text-sm font-semibold tracking-wide">MULTIPLAYER BOWLING GAMES</span>
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
                  }`}
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
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center transform ${
                      game.available ? 'group-hover:scale-110 group-hover:rotate-6' : ''
                    } transition-all duration-500 shadow-lg ${isHovered ? game.glowColor + ' shadow-2xl' : ''}`}>
                      <Icon size={32} className="text-white" />
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
                  Top Bowlers
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

          {/* Footer Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-8 py-4">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">4</div>
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
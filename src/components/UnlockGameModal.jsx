import React from 'react';
import { X, Coins, Sparkles, Play, Crown, Star } from 'lucide-react';
import { GAME_UNLOCK_COST } from '../stripeConfig';

export default function UnlockGameModal({
  isOpen,
  onClose,
  gameName,
  userCredits,
  onUseCredit,
  onBuyCredits,
  onSubscribe,
  onWatchAd
}) {
  if (!isOpen) return null;

  const hasEnoughCredits = userCredits >= GAME_UNLOCK_COST;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-lg w-full border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl font-bold text-white">Unlock {gameName}</h2>
              </div>
              <p className="text-purple-100">Choose how you'd like to play</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Credits Display */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-sm text-slate-400">Your Balance</div>
                <div className="text-2xl font-bold text-yellow-400">{userCredits} Credits</div>
              </div>
            </div>
          </div>

          {/* Option 1: Use Credit */}
          <button
            onClick={onUseCredit}
            disabled={!hasEnoughCredits}
            className={`w-full p-5 rounded-xl border-2 transition-all ${
              hasEnoughCredits
                ? 'border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30'
                : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-cyan-500 rounded-full p-3">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-lg font-bold text-white">Use {GAME_UNLOCK_COST} Credit</div>
                <div className="text-sm text-slate-400">Play without ads right now</div>
              </div>
              {hasEnoughCredits && (
                <div className="text-cyan-400 font-bold">→</div>
              )}
            </div>
          </button>

          {/* Option 2: Watch Ad */}
          <button
            onClick={onWatchAd}
            className="w-full p-5 rounded-xl border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 rounded-full p-3">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-lg font-bold text-white">Watch Ad</div>
                <div className="text-sm text-slate-400">Free 24-hour access to all games</div>
              </div>
              <div className="text-blue-400 font-bold">→</div>
            </div>
          </button>

          {/* Option 3: Buy Credits */}
          <button
            onClick={onBuyCredits}
            className="w-full p-5 rounded-xl border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 rounded-full p-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-lg font-bold text-white">Buy Credits</div>
                <div className="text-sm text-slate-400">Starting at $0.99 for 10 credits</div>
              </div>
              <div className="text-purple-400 font-bold">→</div>
            </div>
          </button>

          {/* Option 4: Subscribe */}
          <button
            onClick={onSubscribe}
            className="w-full p-5 rounded-xl border-2 border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 hover:shadow-lg hover:shadow-yellow-500/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              Best Value
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-lg font-bold text-white">Go Ad-Free</div>
                <div className="text-sm text-slate-400">$2.99/month - Unlimited access</div>
              </div>
              <div className="text-yellow-400 font-bold">→</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

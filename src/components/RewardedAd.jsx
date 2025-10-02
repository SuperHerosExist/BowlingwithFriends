import React, { useState } from 'react';
import { Play, X, Gift } from 'lucide-react';

export default function RewardedAd({ isOpen, onClose, onRewardGranted, gameName }) {
  const [loading, setLoading] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  if (!isOpen) return null;

  const handleWatchAd = () => {
    setLoading(true);

    // In production, this would trigger an actual rewarded video ad
    // For now, simulate watching an ad
    setTimeout(() => {
      setLoading(false);
      setAdWatched(true);

      // Grant reward after 2 more seconds
      setTimeout(() => {
        onRewardGranted();
        onClose();
      }, 2000);
    }, 3000); // Simulate 3-second ad
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      ></div>

      <div
        className="relative rounded-2xl max-w-md w-full p-8"
        style={{
          background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))',
          border: '2px solid rgb(124, 58, 237)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition"
          style={{ backgroundColor: 'rgba(71, 85, 105, 0.5)', color: 'rgb(148, 163, 184)' }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(124, 58, 237))' }}
          >
            <Gift size={32} style={{ color: 'rgb(255, 255, 255)' }} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'rgb(255, 255, 255)' }}>
          {adWatched ? 'Unlocked!' : 'Watch Ad to Play'}
        </h2>

        {/* Description */}
        {!adWatched ? (
          <>
            <p className="text-center mb-6" style={{ color: 'rgb(148, 163, 184)' }}>
              Watch a short ad to unlock <span className="font-bold" style={{ color: 'rgb(168, 85, 247)' }}>{gameName}</span> for 24 hours
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(168, 85, 247)' }}></div>
                <span className="text-sm" style={{ color: 'rgb(203, 213, 225)' }}>Play unlimited games for 24 hours</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(168, 85, 247)' }}></div>
                <span className="text-sm" style={{ color: 'rgb(203, 213, 225)' }}>Track your stats</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(168, 85, 247)' }}></div>
                <span className="text-sm" style={{ color: 'rgb(203, 213, 225)' }}>100% free</span>
              </div>
            </div>

            <button
              onClick={handleWatchAd}
              disabled={loading}
              className="w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgb(71, 85, 105)' : 'linear-gradient(to right, rgb(168, 85, 247), rgb(124, 58, 237))',
                color: 'rgb(255, 255, 255)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading Ad...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Watch Ad (30s)</span>
                </>
              )}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: 'rgb(100, 116, 139)' }}>
              Or <button onClick={onClose} className="underline hover:text-purple-400">sign up</button> for unlimited access
            </p>
          </>
        ) : (
          <>
            <p className="text-center mb-6" style={{ color: 'rgb(34, 197, 94)' }}>
              ✅ You can now play {gameName} for the next 24 hours!
            </p>
            <div className="flex justify-center">
              <div className="animate-bounce">
                <Gift size={48} style={{ color: 'rgb(168, 85, 247)' }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

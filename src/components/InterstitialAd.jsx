import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function InterstitialAd({ isOpen, onClose, autoCloseDelay = 5000 }) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanClose(false);
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      ></div>

      {/* Ad Container */}
      <div className="relative max-w-2xl w-full mx-4">
        {/* Close Button - Only show after countdown */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 rounded-lg transition flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgb(255, 255, 255)' }}
          >
            <X size={20} />
            <span className="text-sm font-medium">Close Ad</span>
          </button>
        )}

        {/* Countdown Indicator */}
        {!canClose && (
          <div className="absolute -top-12 right-0 px-4 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Loader2 size={16} className="animate-spin" style={{ color: 'rgb(168, 85, 247)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgb(255, 255, 255)' }}>
              Ad closes in {countdown}s
            </span>
          </div>
        )}

        {/* Ad Content - This would be the actual AdSense ad */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))',
            border: '2px solid rgb(51, 65, 85)',
            minHeight: '400px'
          }}
        >
          {/* AdSense Responsive Ad */}
          <div className="p-4">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', minHeight: '350px' }}
              data-ad-client="ca-pub-9558998933851822"
              data-ad-slot="1234567890"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          </div>

          {/* Fallback content while ad loads */}
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(124, 58, 237))' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'rgb(255, 255, 255)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgb(148, 163, 184)' }}>Loading advertisement...</p>
              <p className="text-xs mt-2" style={{ color: 'rgb(100, 116, 139)' }}>Thanks for supporting free games!</p>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs mt-4" style={{ color: 'rgb(100, 116, 139)' }}>
          Ads help us keep Bowling with Friends free for everyone 🎳
        </p>
      </div>
    </div>
  );
}

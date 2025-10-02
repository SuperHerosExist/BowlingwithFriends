import React, { useState } from 'react';
import { X, Coins, Zap, Sparkles, Star } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY, PRICING } from '../stripeConfig';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function CreditsModal({ isOpen, onClose, user, currentCredits }) {
  const [selectedPack, setSelectedPack] = useState('medium');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!user || user.isAnonymous) {
      alert('Please sign in to purchase credits');
      return;
    }

    setLoading(true);
    try {
      const stripe = await stripePromise;
      const pack = PRICING.credits[selectedPack];

      // Create checkout session via Netlify Function
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: pack.priceId,
          userId: user.uid,
          email: user.email,
          credits: pack.credits,
          mode: 'payment'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        alert(result.error.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase credits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const packs = [
    {
      id: 'small',
      icon: Coins,
      color: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/20',
      hover: 'hover:shadow-blue-500/40'
    },
    {
      id: 'medium',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      hover: 'hover:shadow-purple-500/40',
      badge: 'Most Popular'
    },
    {
      id: 'large',
      icon: Sparkles,
      color: 'from-yellow-500 to-orange-500',
      shadow: 'shadow-yellow-500/20',
      hover: 'hover:shadow-yellow-500/40',
      badge: 'Best Value'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl font-bold text-white">Buy Credits</h2>
              </div>
              <p className="text-cyan-100">Play premium games without watching ads</p>
              {currentCredits !== undefined && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span className="text-white font-semibold">Current Balance: {currentCredits} credits</span>
                </div>
              )}
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
        <div className="p-6 space-y-6">
          {/* Credit Packs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packs.map((pack) => {
              const packData = PRICING.credits[pack.id];
              const Icon = pack.icon;
              const isSelected = selectedPack === pack.id;

              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `border-transparent bg-gradient-to-br ${pack.color} shadow-xl ${pack.hover}`
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  {pack.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {pack.badge}
                    </div>
                  )}

                  <div className={`mb-4 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                    <Icon className="w-10 h-10 mx-auto" />
                  </div>

                  <div className={`text-xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {packData.name}
                  </div>

                  <div className={`text-4xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {packData.credits}
                  </div>

                  <div className={`text-sm mb-3 ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                    credits
                  </div>

                  {packData.bonus && (
                    <div className={`text-sm font-semibold mb-3 ${isSelected ? 'text-yellow-200' : 'text-yellow-500'}`}>
                      +{packData.bonus} Bonus Credits!
                    </div>
                  )}

                  <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    ${packData.amount}
                  </div>

                  <div className={`text-xs mt-2 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    ${(packData.amount / packData.credits).toFixed(2)} per credit
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-cyan-300 mb-1">How Credits Work:</p>
                <ul className="space-y-1 text-gray-400">
                  <li>• Use 1 credit to unlock any premium game</li>
                  <li>• Credits never expire</li>
                  <li>• No ads when playing with credits</li>
                  <li>• Perfect for occasional players</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className={`w-full bg-gradient-to-r ${packs.find(p => p.id === selectedPack).color} hover:shadow-xl text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg ${packs.find(p => p.id === selectedPack).shadow} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              `Buy ${PRICING.credits[selectedPack].credits} Credits for $${PRICING.credits[selectedPack].amount}`
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

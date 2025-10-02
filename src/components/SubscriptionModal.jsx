import React, { useState } from 'react';
import { X, Check, Sparkles, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY, PRICING } from '../stripeConfig';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function SubscriptionModal({ isOpen, onClose, user }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!user || user.isAnonymous) {
      alert('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      const stripe = await stripePromise;
      const plan = PRICING.subscription[selectedPlan];

      // Create checkout session via Netlify Function
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.uid,
          email: user.email,
          mode: 'subscription'
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
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Remove all ads forever',
    'Unlimited access to all games',
    'Priority customer support',
    'Early access to new features',
    'Support indie development'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl font-bold text-white">Go Ad-Free</h2>
              </div>
              <p className="text-purple-100">Unlimited bowling, zero interruptions</p>
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
          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-sm text-gray-400 mb-1">Monthly</div>
              <div className="text-3xl font-bold text-white mb-1">
                ${PRICING.subscription.monthly.amount}
              </div>
              <div className="text-sm text-gray-400">per month</div>
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`p-6 rounded-xl border-2 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                Save 44%
              </div>
              <div className="text-sm text-gray-400 mb-1">Yearly</div>
              <div className="text-3xl font-bold text-white mb-1">
                ${PRICING.subscription.yearly.amount}
              </div>
              <div className="text-sm text-gray-400">per year</div>
              <div className="text-xs text-purple-400 mt-2">
                ${(PRICING.subscription.yearly.amount / 12).toFixed(2)}/month
              </div>
            </button>
          </div>

          {/* Features */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              What you get:
            </h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              `Subscribe for $${PRICING.subscription[selectedPlan].amount}/${selectedPlan === 'monthly' ? 'mo' : 'yr'}`
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}

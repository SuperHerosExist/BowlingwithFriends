import { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, get } from 'firebase/database';

/**
 * Hook to manage user payment data (credits and subscription)
 */
export function useUserPayment(userId) {
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState({
    isActive: false,
    plan: null,
    startDate: null,
    endDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${userId}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setCredits(userData.credits || 0);
        setSubscription(userData.subscription || {
          isActive: false,
          plan: null,
          startDate: null,
          endDate: null
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    if (!subscription.isActive) return false;
    if (!subscription.endDate) return false;
    return Date.now() < subscription.endDate;
  };

  // Check if user should see ads
  const shouldShowAds = () => {
    return !hasActiveSubscription();
  };

  // Spend credits for game unlock
  const spendCredits = async (amount) => {
    if (!userId || credits < amount) {
      return false;
    }

    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const newCredits = (userData.credits || 0) - amount;

        if (newCredits < 0) return false;

        await set(userRef, {
          ...userData,
          credits: newCredits
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  };

  // Add credits (for purchases or admin)
  const addCredits = async (amount) => {
    if (!userId) return false;

    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const newCredits = (userData.credits || 0) + amount;

        await set(userRef, {
          ...userData,
          credits: newCredits
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  };

  return {
    credits,
    subscription,
    loading,
    hasActiveSubscription: hasActiveSubscription(),
    shouldShowAds: shouldShowAds(),
    spendCredits,
    addCredits
  };
}

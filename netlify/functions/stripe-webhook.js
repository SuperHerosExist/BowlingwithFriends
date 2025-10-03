import Stripe from 'stripe';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const userId = session.metadata.userId;
        const credits = parseInt(session.metadata.credits) || 0;

        if (session.mode === 'payment' && credits > 0) {
          // Add credits to user
          await addCreditsToUser(userId, credits);
          console.log(`Added ${credits} credits to user ${userId}`);
        } else if (session.mode === 'subscription') {
          // Activate subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await activateSubscription(userId, subscription);
          console.log(`Activated subscription for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const userId = subscription.metadata.userId;
        if (userId) {
          await updateSubscription(userId, subscription);
          console.log(`Updated subscription for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const userId = subscription.metadata.userId;
        if (userId) {
          await deactivateSubscription(userId);
          console.log(`Deactivated subscription for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Subscription renewal successful
        const invoice = stripeEvent.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata.userId;
          if (userId) {
            await updateSubscription(userId, subscription);
            console.log(`Renewed subscription for user ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Subscription payment failed
        const invoice = stripeEvent.data.object;
        console.log(`Payment failed for invoice ${invoice.id}`);
        // Optionally notify user or take action
        break;
      }

      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

// Helper functions
async function addCreditsToUser(userId, creditsToAdd) {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();
    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    await set(userRef, {
      ...userData,
      credits: newCredits,
    });
  }
}

async function activateSubscription(userId, subscription) {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();
    const plan = subscription.items.data[0].price.recurring.interval; // 'month' or 'year'

    await set(userRef, {
      ...userData,
      subscription: {
        isActive: true,
        plan: plan,
        startDate: subscription.current_period_start * 1000,
        endDate: subscription.current_period_end * 1000,
        stripeSubscriptionId: subscription.id,
      },
    });
  }
}

async function updateSubscription(userId, subscription) {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();
    const plan = subscription.items.data[0].price.recurring.interval;

    await set(userRef, {
      ...userData,
      subscription: {
        isActive: subscription.status === 'active',
        plan: plan,
        startDate: subscription.current_period_start * 1000,
        endDate: subscription.current_period_end * 1000,
        stripeSubscriptionId: subscription.id,
      },
    });
  }
}

async function deactivateSubscription(userId) {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();

    await set(userRef, {
      ...userData,
      subscription: {
        isActive: false,
        plan: null,
        startDate: null,
        endDate: null,
        stripeSubscriptionId: null,
      },
    });
  }
}

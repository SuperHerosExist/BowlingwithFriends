// Stripe Configuration
// Get your publishable key from: https://dashboard.stripe.com/apikeys

export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SDsYbAFCuklL7z9JeRD75CsHePhmbpNOLA5injymkkxpvdOEPfqomnuh59cjSHSmC42jA5hbbyQheqJaDQH00rK00lbf5KUgB';

// Pricing Plans
export const PRICING = {
  subscription: {
    monthly: {
      priceId: 'price_1SDtWbAFCuklL7z9RLWbjP6P',
      amount: 2.99,
      interval: 'month',
      name: 'Ad-Free Monthly'
    },
    yearly: {
      priceId: 'price_1SDtWbAFCuklL7z9drqnyJfm',
      amount: 19.99,
      interval: 'year',
      name: 'Ad-Free Yearly'
    }
  },
  credits: {
    small: {
      priceId: 'price_1SDtWcAFCuklL7z9zKEVLQpB',
      amount: 0.99,
      credits: 10,
      name: 'Starter Pack'
    },
    medium: {
      priceId: 'price_1SDtWcAFCuklL7z9XTpzLgk4',
      amount: 4.99,
      credits: 60,
      name: 'Popular Pack',
      bonus: 10 // Total 60 credits
    },
    large: {
      priceId: 'price_1SDtWdAFCuklL7z9B4ogxHgi',
      amount: 9.99,
      credits: 150,
      name: 'Value Pack',
      bonus: 30 // Total 150 credits
    }
  }
};

// Cost per game unlock in credits
export const GAME_UNLOCK_COST = 1;

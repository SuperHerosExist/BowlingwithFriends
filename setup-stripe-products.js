// Script to create Stripe products and prices
import Stripe from 'stripe';
import { writeFileSync, readFileSync } from 'fs';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

async function setupStripeProducts() {
  console.log('🎯 Creating Stripe products and prices...\n');

  try {
    // 1. Monthly Subscription
    console.log('Creating Monthly Subscription...');
    const monthlyProduct = await stripe.products.create({
      name: 'Bowling Fun - Ad-Free Monthly',
      description: 'Remove all ads and get unlimited access to all games for one month',
    });

    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: 299, // $2.99
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log('✅ Monthly: ', monthlyPrice.id);

    // 2. Yearly Subscription
    console.log('\nCreating Yearly Subscription...');
    const yearlyProduct = await stripe.products.create({
      name: 'Bowling Fun - Ad-Free Yearly',
      description: 'Remove all ads and get unlimited access to all games for one year (Save 44%)',
    });

    const yearlyPrice = await stripe.prices.create({
      product: yearlyProduct.id,
      unit_amount: 1999, // $19.99
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    console.log('✅ Yearly: ', yearlyPrice.id);

    // 3. Starter Pack (10 credits)
    console.log('\nCreating Starter Pack...');
    const starterProduct = await stripe.products.create({
      name: 'Starter Pack - 10 Credits',
      description: 'Get 10 game credits to play premium games without ads',
      metadata: { credits: '10' }
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 99, // $0.99
      currency: 'usd',
    });
    console.log('✅ Starter: ', starterPrice.id);

    // 4. Popular Pack (60 credits)
    console.log('\nCreating Popular Pack...');
    const popularProduct = await stripe.products.create({
      name: 'Popular Pack - 60 Credits',
      description: 'Get 60 game credits (includes 10 bonus credits!)',
      metadata: { credits: '60' }
    });

    const popularPrice = await stripe.prices.create({
      product: popularProduct.id,
      unit_amount: 499, // $4.99
      currency: 'usd',
    });
    console.log('✅ Popular: ', popularPrice.id);

    // 5. Value Pack (150 credits)
    console.log('\nCreating Value Pack...');
    const valueProduct = await stripe.products.create({
      name: 'Value Pack - 150 Credits',
      description: 'Get 150 game credits (includes 30 bonus credits!) - Best Value!',
      metadata: { credits: '150' }
    });

    const valuePrice = await stripe.prices.create({
      product: valueProduct.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
    });
    console.log('✅ Value: ', valuePrice.id);

    // Update stripeConfig.js with the new price IDs
    console.log('\n📝 Updating stripeConfig.js...');

    const configContent = `// Stripe Configuration
// Get your publishable key from: https://dashboard.stripe.com/apikeys

export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SDsYbAFCuklL7z9JeRD75CsHePhmbpNOLA5injymkkxpvdOEPfqomnuh59cjSHSmC42jA5hbbyQheqJaDQH00rK00lbf5KUgB';

// Pricing Plans
export const PRICING = {
  subscription: {
    monthly: {
      priceId: '${monthlyPrice.id}',
      amount: 2.99,
      interval: 'month',
      name: 'Ad-Free Monthly'
    },
    yearly: {
      priceId: '${yearlyPrice.id}',
      amount: 19.99,
      interval: 'year',
      name: 'Ad-Free Yearly'
    }
  },
  credits: {
    small: {
      priceId: '${starterPrice.id}',
      amount: 0.99,
      credits: 10,
      name: 'Starter Pack'
    },
    medium: {
      priceId: '${popularPrice.id}',
      amount: 4.99,
      credits: 60,
      name: 'Popular Pack',
      bonus: 10 // Total 60 credits
    },
    large: {
      priceId: '${valuePrice.id}',
      amount: 9.99,
      credits: 150,
      name: 'Value Pack',
      bonus: 30 // Total 150 credits
    }
  }
};

// Cost per game unlock in credits
export const GAME_UNLOCK_COST = 1;
`;

    writeFileSync('./src/stripeConfig.js', configContent);

    console.log('\n✅ All done! Products created and config updated.');
    console.log('\n📋 Summary:');
    console.log('Monthly Subscription:', monthlyPrice.id);
    console.log('Yearly Subscription:', yearlyPrice.id);
    console.log('Starter Pack (10 credits):', starterPrice.id);
    console.log('Popular Pack (60 credits):', popularPrice.id);
    console.log('Value Pack (150 credits):', valuePrice.id);

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

setupStripeProducts();

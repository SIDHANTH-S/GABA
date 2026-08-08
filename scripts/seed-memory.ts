/**
 * seed-memory.ts
 * Seeds demo profile and domain memories into Electron DB
 * Run: npm run seed
 */

import { app } from 'electron';
import { initDB } from '../electron-main/db';
import { setUserProfile, upsertDomainMemory } from '../agent-core/memory-manager';

async function seed() {
  console.log('🌱 Seeding demo profile and memories...');

  await initDB();

  // Insert demo user profile
  setUserProfile({
    id: 'user-001',
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@example.com',
    phone: '+1 (555) 019-2834',
    address: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      zip: '97477',
      country: 'USA',
    },
    custom: {
      timezone: 'America/Los_Angeles',
      language: 'en',
      theme: 'dark',
    },
  });

  console.log('✅ Profile created: Alex Chen');

  // Insert demo domain memories
  const demoPreferences = {
    favorite_airline: 'United Airlines',
    frequent_flyer_number: 'UA123456789',
    preferred_seat: 'aisle',
    home_airport: 'SFO',
    passport_expiry: '2028-06-15',
    dietary_preference: 'vegetarian',
    credit_card_last4: '4242',
  };

  upsertDomainMemory('kayak.com', {
    formInputs: {
      email: 'alex.chen@example.com',
      phone: '+1 (555) 019-2834',
      frequent_flyer: 'UA123456789',
    },
    preferences: demoPreferences,
    taskHistory: ['Book flight SFO to NYC', 'Search Paris hotels'],
  });

  upsertDomainMemory('general', {
    preferences: demoPreferences,
  });

  console.log(`✅ Demo memories seeded for kayak.com and general domain`);

  console.log('\n🎉 Demo data ready! Launch the app with: npm run dev');
  if (app) app.quit();
  process.exit(0);
}

if (app && !app.isReady()) {
  app.on('ready', seed);
} else {
  seed();
}

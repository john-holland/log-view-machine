import axios from 'axios';

const UNLEASH_URL = process.env.UNLEASH_URL || 'http://unleash:4242';
const UNLEASH_API_KEY = process.env.UNLEASH_API_KEY || 'default:development.unleash-insecure-api-token';

const FEATURE_TOGGLES = [
  {
    name: 'tracing',
    description: 'Enable OpenTelemetry tracing',
    enabled: true,
    strategies: [
      {
        name: 'default',
        parameters: {}
      }
    ]
  },
  {
    name: 'metrics',
    description: 'Enable metrics collection',
    enabled: true,
    strategies: [
      {
        name: 'default',
        parameters: {}
      }
    ]
  },
  {
    name: 'ipBanning',
    description: 'Enable IP banning for failed authentication attempts',
    enabled: true,
    strategies: [
      {
        name: 'ipBan',
        parameters: {
          maxAttempts: '5',
          banDuration: '3600',
          windowSize: '300'
        }
      }
    ]
  },
  {
    name: 'timedBanning',
    description: 'Enable timed bans for specific durations',
    enabled: true,
    strategies: [
      {
        name: 'timedBan',
        parameters: {
          banDuration: '86400'
        }
      }
    ]
  },
  {
    name: 'p2pManagement',
    description: 'Enable P2P connection management',
    enabled: true,
    strategies: [
      {
        name: 'p2pConnectionLimit',
        parameters: {
          maxConnections: '10',
          ghostDuration: '300'
        }
      }
    ]
  },
  {
    name: 'banAppeal',
    description: 'Enable ban appeal system',
    enabled: true,
    strategies: [
      {
        name: 'default',
        parameters: {}
      }
    ]
  }
];

async function initializeUnleash() {
  try {
    console.log('Initializing Unleash...');

    // Create feature toggles
    for (const toggle of FEATURE_TOGGLES) {
      try {
        await axios.post(
          `${UNLEASH_URL}/api/admin/features`,
          toggle,
          {
            headers: {
              'Authorization': UNLEASH_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`Created feature toggle: ${toggle.name}`);
      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log(`Feature toggle ${toggle.name} already exists`);
        } else {
          console.error(`Error creating feature toggle ${toggle.name}:`, error.message);
        }
      }
    }

    console.log('Unleash initialization complete! 🎉');
  } catch (error: any) {
    console.error('Error initializing Unleash:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeUnleash();
}

export { initializeUnleash }; 
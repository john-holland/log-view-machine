import { metrics, ObservableResult, Context } from '@opentelemetry/api';
import axios from 'axios';

const meter = metrics.getMeter('fishburger-api');

// Create metrics
const burgerCounter = meter.createCounter('burgers_created_total', {
  description: 'Total number of burgers created'
});

const burgerStateGauge = meter.createObservableGauge('burger_states', {
  description: 'Current number of burgers in each state'
});

const orderLatencyHistogram = meter.createHistogram('order_processing_latency_seconds', {
  description: 'Time taken to process orders'
});

const ingredientUsageCounter = meter.createCounter('ingredient_usage_total', {
  description: 'Total usage of each ingredient'
});

const cohortSizeGauge = meter.createObservableGauge('cohort_sizes', {
  description: 'Current size of each cohort'
});

// Register observable callbacks
meter.addBatchObservableCallback(async (observableResult: ObservableResult, context: Context) => {
  try {
    // Get current burger states
    const response = await axios.get('http://localhost:3000/api/burgers/states');
    const states = response.data as Record<string, number>;
    
    // Update burger state gauge
    for (const [state, count] of Object.entries(states)) {
      observableResult.observe(burgerStateGauge, count, { state });
    }

    // Get cohort sizes
    const cohortResponse = await axios.get('http://localhost:3000/api/cohorts/sizes');
    const cohortSizes = cohortResponse.data as Record<string, number>;
    
    // Update cohort size gauge
    for (const [cohort, size] of Object.entries(cohortSizes)) {
      observableResult.observe(cohortSizeGauge, size, { cohort });
    }
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
});

async function generateExampleMetrics() {
  // Simulate burger creation
  burgerCounter.add(1, { type: 'spicy' });
  burgerCounter.add(1, { type: 'classic' });

  // Simulate ingredient usage
  ingredientUsageCounter.add(2, { ingredient: 'fish_patty' });
  ingredientUsageCounter.add(4, { ingredient: 'bun' });
  ingredientUsageCounter.add(3, { ingredient: 'cheese' });
  ingredientUsageCounter.add(1, { ingredient: 'spicy_sauce' });

  // Simulate order processing latency
  orderLatencyHistogram.record(1.5, { type: 'standard' });
  orderLatencyHistogram.record(2.3, { type: 'custom' });
  orderLatencyHistogram.record(0.8, { type: 'quick' });

  console.log('Generated example metrics! 🎉');
}

// Run if called directly
if (require.main === module) {
  generateExampleMetrics().catch(console.error);
}

export { generateExampleMetrics }; 
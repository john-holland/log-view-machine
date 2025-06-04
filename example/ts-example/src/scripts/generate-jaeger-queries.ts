import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import axios from 'axios';

const tracer = trace.getTracer('fishburger-api');

async function generateExampleQueries() {
  // Example 1: Create a new burger
  const createBurgerSpan = tracer.startSpan('create-burger');
  try {
    await context.with(trace.setSpan(context.active(), createBurgerSpan), async () => {
      const response = await axios.post('http://localhost:3000/api/burgers', {
        name: 'Spicy Fish Delight',
        ingredients: [
          { id: 1, quantity: 1 }, // Fish Patty
          { id: 2, quantity: 2 }, // Buns
          { id: 3, quantity: 2 }, // Cheese
          { id: 4, quantity: 1 }  // Spicy Sauce
        ]
      });
      console.log('Created burger:', response.data);
    });
  } catch (error) {
    createBurgerSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    createBurgerSpan.end();
  }

  // Example 2: Update burger state
  const updateStateSpan = tracer.startSpan('update-burger-state');
  try {
    await context.with(trace.setSpan(context.active(), updateStateSpan), async () => {
      const response = await axios.patch('http://localhost:3000/api/burgers/1/state', {
        state: 'COOKING'
      });
      console.log('Updated burger state:', response.data);
    });
  } catch (error) {
    updateStateSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    updateStateSpan.end();
  }

  // Example 3: Get burger details with ingredients
  const getBurgerSpan = tracer.startSpan('get-burger-details');
  try {
    await context.with(trace.setSpan(context.active(), getBurgerSpan), async () => {
      const response = await axios.get('http://localhost:3000/api/burgers/1');
      console.log('Burger details:', response.data);
    });
  } catch (error) {
    getBurgerSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    getBurgerSpan.end();
  }

  // Example 4: List all burgers
  const listBurgersSpan = tracer.startSpan('list-burgers');
  try {
    await context.with(trace.setSpan(context.active(), listBurgersSpan), async () => {
      const response = await axios.get('http://localhost:3000/api/burgers');
      console.log('All burgers:', response.data);
    });
  } catch (error) {
    listBurgersSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    listBurgersSpan.end();
  }

  // Example 5: Create a new cohort
  const createCohortSpan = tracer.startSpan('create-cohort');
  try {
    await context.with(trace.setSpan(context.active(), createCohortSpan), async () => {
      const response = await axios.post('http://localhost:3000/api/cohorts', {
        name: 'PAX East 2024',
        type: 'EVENT'
      });
      console.log('Created cohort:', response.data);
    });
  } catch (error) {
    createCohortSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    createCohortSpan.end();
  }
}

// Run if called directly
if (require.main === module) {
  generateExampleQueries().catch(console.error);
}

export { generateExampleQueries }; 
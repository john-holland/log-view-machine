import axios from 'axios';

const DATADOG_API_KEY = process.env.DATADOG_API_KEY;
const DATADOG_APP_KEY = process.env.DATADOG_APP_KEY;
const DATADOG_API_URL = 'https://api.datadoghq.com/api/v1';

interface Dashboard {
  title: string;
  description: string;
  widgets: Widget[];
  layout_type: string;
}

interface Widget {
  definition: {
    type: string;
    title: string;
    requests: any[];
    [key: string]: any;
  };
}

async function generateDashboards() {
  if (!DATADOG_API_KEY || !DATADOG_APP_KEY) {
    console.error('Please set DATADOG_API_KEY and DATADOG_APP_KEY environment variables');
    process.exit(1);
  }

  const headers = {
    'DD-API-KEY': DATADOG_API_KEY,
    'DD-APPLICATION-KEY': DATADOG_APP_KEY,
    'Content-Type': 'application/json'
  };

  // Create Burger Operations Dashboard
  const burgerOpsDashboard: Dashboard = {
    title: 'Fish Burger Operations',
    description: 'Monitor burger creation, states, and processing times',
    layout_type: 'ordered',
    widgets: [
      {
        definition: {
          type: 'timeseries',
          title: 'Burgers Created by Type',
          requests: [
            {
              q: 'sum:burgers_created_total{*} by {type}',
              display_type: 'line'
            }
          ]
        }
      },
      {
        definition: {
          type: 'gauge',
          title: 'Current Burger States',
          requests: [
            {
              q: 'avg:burger_states{*} by {state}',
              display_type: 'number'
            }
          ]
        }
      },
      {
        definition: {
          type: 'heatmap',
          title: 'Order Processing Latency',
          requests: [
            {
              q: 'avg:order_processing_latency_seconds{*} by {type}',
              display_type: 'number'
            }
          ]
        }
      }
    ]
  };

  // Create Ingredient Management Dashboard
  const ingredientDashboard: Dashboard = {
    title: 'Ingredient Management',
    description: 'Track ingredient usage and inventory levels',
    layout_type: 'ordered',
    widgets: [
      {
        definition: {
          type: 'timeseries',
          title: 'Ingredient Usage',
          requests: [
            {
              q: 'sum:ingredient_usage_total{*} by {ingredient}',
              display_type: 'line'
            }
          ]
        }
      },
      {
        definition: {
          type: 'toplist',
          title: 'Most Used Ingredients',
          requests: [
            {
              q: 'top(sum:ingredient_usage_total{*} by {ingredient}, 5, "mean", "desc")',
              display_type: 'number'
            }
          ]
        }
      }
    ]
  };

  // Create Cohort Analytics Dashboard
  const cohortDashboard: Dashboard = {
    title: 'Cohort Analytics',
    description: 'Monitor cohort sizes and activity',
    layout_type: 'ordered',
    widgets: [
      {
        definition: {
          type: 'timeseries',
          title: 'Cohort Sizes',
          requests: [
            {
              q: 'avg:cohort_sizes{*} by {cohort}',
              display_type: 'line'
            }
          ]
        }
      },
      {
        definition: {
          type: 'query_value',
          title: 'Total Active Cohorts',
          requests: [
            {
              q: 'count:cohort_sizes{*}',
              display_type: 'number'
            }
          ]
        }
      }
    ]
  };

  try {
    // Create dashboards
    const dashboards = [burgerOpsDashboard, ingredientDashboard, cohortDashboard];
    for (const dashboard of dashboards) {
      const response = await axios.post(
        `${DATADOG_API_URL}/dashboard`,
        dashboard,
        { headers }
      );
      console.log(`Created dashboard: ${dashboard.title}`);
      console.log(`Dashboard URL: ${response.data.url}`);
    }

    console.log('Generated DataDog dashboards! 🎉');
  } catch (error: any) {
    console.error('Error creating dashboards:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateDashboards().catch(console.error);
}

export { generateDashboards }; 
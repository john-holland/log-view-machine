import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fishburger',
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for burgers and register
let burgers = [];
let burgerId = 1;
let register = {
  totalSales: 0,
  totalBurgers: 0,
  dailySales: 0,
  lastReset: new Date().toISOString()
};

// Fish burger state machine logic
const states = {
  INITIAL: 'INITIAL',
  PREPARING: 'PREPARING', 
  COOKING: 'COOKING',
  READY: 'READY',
  EAT: 'EAT',
  TRASH: 'TRASH',
  FIREEXTINGUISH: 'FIREEXTINGUISH'
};

// Sample ingredients with prices
const ingredients = {
  'Fish Patty': 5.99,
  'Bun': 1.99,
  'Lettuce': 0.99,
  'Tomato': 0.99,
  'Cheese': 1.49,
  'Special Sauce': 0.50,
  'Pickles': 0.75,
  'Bacon': 2.99,
  'Avocado': 1.99
};

// Helper function to calculate burger cost
function calculateBurgerCost(selectedIngredients) {
  return selectedIngredients.reduce((total, ingredient) => {
    return total + (ingredients[ingredient] || 0);
  }, 0);
}

// Helper function to add log with ingredients
function addLog(burger, level, message, ingredients = null) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (ingredients) {
    logEntry.ingredients = ingredients;
    logEntry.totalCost = calculateBurgerCost(ingredients);
  }
  
  burger.logs.push(logEntry);
}

// Create a new burger
app.post('/api/burgers', async (req, res) => {
  try {
    const { isHungry = false, ingredients: selectedIngredients = [] } = req.body;
    
    const burger = {
      id: burgerId++,
      state: states.INITIAL,
      isHungry,
      ingredients: selectedIngredients,
      totalCost: calculateBurgerCost(selectedIngredients),
      createdAt: new Date().toISOString(),
      logs: []
    };
    
    burgers.push(burger);
    
    // Update register
    register.totalBurgers++;
    register.totalSales += burger.totalCost;
    register.dailySales += burger.totalCost;
    
    // Add initial log with ingredients
    addLog(burger, 'INFO', 'Order received', selectedIngredients);
    
    // Start the cooking process
    setTimeout(() => {
      burger.state = states.PREPARING;
      addLog(burger, 'INFO', 'Starting to cook the fish burger', selectedIngredients);
      
      setTimeout(() => {
        burger.state = states.COOKING;
        addLog(burger, 'INFO', 'Fish burger is cooking', selectedIngredients);
        
        setTimeout(() => {
          burger.state = states.READY;
          burger.isHungry = true;
          addLog(burger, 'INFO', 'Fish burger is ready to eat!', selectedIngredients);
        }, 2000);
      }, 1000);
    }, 100);
    
    res.json(burger);
  } catch (error) {
    console.error('Error creating burger:', error);
    res.status(500).json({ error: 'Failed to create burger' });
  }
});

// Get all burgers
app.get('/api/burgers', async (req, res) => {
  try {
    res.json(burgers);
  } catch (error) {
    console.error('Error getting burgers:', error);
    res.status(500).json({ error: 'Failed to get burgers' });
  }
});

// Get a specific burger
app.get('/api/burgers/:id', async (req, res) => {
  try {
    const burger = burgers.find(b => b.id === parseInt(req.params.id));
    if (!burger) {
      return res.status(404).json({ error: 'Burger not found' });
    }
    res.json(burger);
  } catch (error) {
    console.error('Error getting burger:', error);
    res.status(500).json({ error: 'Failed to get burger' });
  }
});

// Eat a burger
app.post('/api/burgers/:id/eat', async (req, res) => {
  try {
    const burger = burgers.find(b => b.id === parseInt(req.params.id));
    if (!burger) {
      return res.status(404).json({ error: 'Burger not found' });
    }
    
    burger.state = states.EAT;
    burger.isHungry = false;
    addLog(burger, 'INFO', 'Eating the fish burger...', burger.ingredients);
    
    // Random chance of fire
    if (Math.random() < 0.001) {
      setTimeout(() => {
        burger.state = states.FIREEXTINGUISH;
        addLog(burger, 'WARN', 'Fire! Need to extinguish!', burger.ingredients);
        
        setTimeout(() => {
          burger.state = states.PREPARING;
          addLog(burger, 'INFO', 'Fire extinguished, starting over', burger.ingredients);
        }, 1000);
      }, 500);
    } else {
      setTimeout(() => {
        burger.state = states.PREPARING;
        addLog(burger, 'INFO', 'Burger eaten, preparing next one', burger.ingredients);
      }, 1000);
    }
    
    res.json(burger);
  } catch (error) {
    console.error('Error eating burger:', error);
    res.status(500).json({ error: 'Failed to eat burger' });
  }
});

// Trash a burger
app.post('/api/burgers/:id/trash', async (req, res) => {
  try {
    const burger = burgers.find(b => b.id === parseInt(req.params.id));
    if (!burger) {
      return res.status(404).json({ error: 'Burger not found' });
    }
    
    burger.state = states.TRASH;
    addLog(burger, 'WARN', 'Burger trashed', burger.ingredients);
    
    setTimeout(() => {
      if (Math.random() < 0.5) {
        burger.state = states.EAT;
        addLog(burger, 'INFO', 'Retrieved from trash and eating', burger.ingredients);
      } else {
        burger.state = states.PREPARING;
        addLog(burger, 'INFO', 'Starting fresh after trashing', burger.ingredients);
      }
    }, 1000);
    
    res.json(burger);
  } catch (error) {
    console.error('Error trashing burger:', error);
    res.status(500).json({ error: 'Failed to trash burger' });
  }
});

// Admin endpoints
app.get('/api/admin/register', async (req, res) => {
  try {
    res.json(register);
  } catch (error) {
    console.error('Error getting register:', error);
    res.status(500).json({ error: 'Failed to get register' });
  }
});

app.post('/api/admin/register/clear', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // Simple admin authentication (in production, use proper auth)
    if (adminKey !== 'fishburger-admin-2024') {
      return res.status(401).json({ error: 'Invalid admin key' });
    }
    
    const oldRegister = { ...register };
    
    register = {
      totalSales: 0,
      totalBurgers: 0,
      dailySales: 0,
      lastReset: new Date().toISOString()
    };
    
    res.json({ 
      message: 'Register cleared successfully',
      oldRegister 
    });
  } catch (error) {
    console.error('Error clearing register:', error);
    res.status(500).json({ error: 'Failed to clear register' });
  }
});

app.post('/api/admin/burgers/clear', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    if (adminKey !== 'fishburger-admin-2024') {
      return res.status(401).json({ error: 'Invalid admin key' });
    }
    
    const oldBurgers = [...burgers];
    burgers = [];
    burgerId = 1;
    
    res.json({ 
      message: 'All burgers cleared successfully',
      clearedCount: oldBurgers.length 
    });
  } catch (error) {
    console.error('Error clearing burgers:', error);
    res.status(500).json({ error: 'Failed to clear burgers' });
  }
});

// Metrics endpoints
app.get('/api/metrics/summary', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    
    // Calculate state distribution
    const stateCounts = {};
    burgers.forEach(burger => {
      stateCounts[burger.state] = (stateCounts[burger.state] || 0) + 1;
    });
    
    const stateDistribution = Object.entries(stateCounts).map(([state, count]) => ({
      state,
      count
    }));
    
    // Calculate ingredient usage
    const ingredientCounts = {};
    burgers.forEach(burger => {
      burger.ingredients.forEach(ingredient => {
        ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1;
      });
    });
    
    const ingredientUsage = Object.entries(ingredientCounts).map(([ingredient, count]) => ({
      ingredient,
      count
    }));
    
    // Get recent errors from logs
    const recentErrors = [];
    burgers.forEach(burger => {
      burger.logs.forEach(log => {
        if (log.level === 'ERROR' || log.level === 'WARN') {
          recentErrors.push({
            error_type: log.level,
            message: log.message,
            timestamp: log.timestamp
          });
        }
      });
    });
    
    res.json({
      totalBurgers: burgers.length,
      totalRevenue: register.totalSales,
      stateDistribution,
      ingredientUsage,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    });
  } catch (error) {
    console.error('Error getting metrics summary:', error);
    res.status(500).json({ error: 'Failed to get metrics summary' });
  }
});

app.get('/api/metrics/performance', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    
    // Calculate average order time (simplified)
    const completedBurgers = burgers.filter(b => b.state === 'EAT' || b.state === 'READY');
    let totalOrderTime = 0;
    
    completedBurgers.forEach(burger => {
      const createdAt = new Date(burger.createdAt);
      const readyLog = burger.logs.find(log => log.message.includes('ready'));
      if (readyLog) {
        const readyTime = new Date(readyLog.timestamp);
        totalOrderTime += (readyTime - createdAt) / 1000; // Convert to seconds
      }
    });
    
    const avgOrderTime = completedBurgers.length > 0 ? totalOrderTime / completedBurgers.length : 0;
    
    res.json({
      avgOrderTime,
      avgApiLatency: 150, // Mock data
      avgDbLatency: 25    // Mock data
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

app.get('/api/metrics/api', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    
    // Mock API metrics data
    res.json([
      {
        endpoint: '/api/burgers',
        method: 'GET',
        request_count: burgers.length * 2,
        avg_duration: 45,
        max_duration: 120,
        error_count: 0
      },
      {
        endpoint: '/api/burgers',
        method: 'POST',
        request_count: burgers.length,
        avg_duration: 85,
        max_duration: 200,
        error_count: 0
      },
      {
        endpoint: '/api/burgers/:id/eat',
        method: 'POST',
        request_count: Math.floor(burgers.length * 0.7),
        avg_duration: 65,
        max_duration: 150,
        error_count: 0
      },
      {
        endpoint: '/api/admin/register',
        method: 'GET',
        request_count: 5,
        avg_duration: 30,
        max_duration: 80,
        error_count: 0
      }
    ]);
  } catch (error) {
    console.error('Error getting API metrics:', error);
    res.status(500).json({ error: 'Failed to get API metrics' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    burgers: burgers.length,
    register: register
  });
});

// Start server
app.listen(port, () => {
  console.log(`Fish Burger Backend running on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
}); 
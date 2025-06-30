import React from 'react';
import { createBurgerCreationView } from '../machines/BurgerCreationViewStateMachine';
import { createViewStateMachine } from '../core/ViewStateMachine';

const BurgerCreationUI: React.FC = () => {
  // Create the state machine
  const burgerCreationMachine = createBurgerCreationView({
    machineId: 'burger-creation',
    adminKey: 'admin123'
  });

  // Create the view state machine with state-specific rendering
  const viewMachine = createViewStateMachine({
    machineId: 'burger-creation-view',
    states: {
      initial: {},
      loading: {},
      ready: {},
      error: {},
      creating: {},
      success: {}
    },
    defaultViewModel: burgerCreationMachine.getViewModel(),
    defaultConfig: { machineId: 'burger-creation-view' }
  })
  .withState('initial', (context) => (
    <div className="burger-creation-container">
      <div className="loading-spinner">Initializing...</div>
    </div>
  ))
  .withState('loading', (context) => (
    <div className="burger-creation-container">
      <div className="loading-spinner">Loading...</div>
    </div>
  ))
  .withState('ready', (context) => (
    <div className="burger-creation-container">
      {/* Error Banner */}
      {context.viewModel.showErrorBanner && (
        <div className="error-banner">
          <span>{context.viewModel.error}</span>
          <button onClick={() => context.sendMessage('clearError')}>×</button>
        </div>
      )}

      {/* Success Message */}
      {context.viewModel.showSuccessMessage && (
        <div className="success-message">
          <span>{context.viewModel.successMessage}</span>
          <button onClick={() => context.sendMessage('clearSuccess')}>×</button>
        </div>
      )}

      {/* Loading Spinner */}
      {context.viewModel.showLoadingSpinner && (
        <div className="loading-overlay">
          <div className="loading-spinner">Processing...</div>
        </div>
      )}

      {/* Main Content */}
      <div className="burger-creation-content">
        <h2>Create Your Tasty Fish Burger</h2>
        
        {/* Register Display */}
        {context.viewModel.register && (
          <div className="register-display">
            <h3>Register: ${context.viewModel.register.total}</h3>
            <p>Burgers Sold: {context.viewModel.register.burgerCount}</p>
          </div>
        )}

        {/* Ingredient Selection */}
        <div className="ingredient-section">
          <h3>Select Ingredients</h3>
          <div className="ingredient-grid">
            {['lettuce', 'tomato', 'onion', 'cheese', 'bacon', 'pickles'].map(ingredient => (
              <label key={ingredient} className="ingredient-item">
                <input
                  type="checkbox"
                  checked={context.viewModel.selectedIngredients.includes(ingredient)}
                  onChange={() => context.sendMessage('toggleIngredient', ingredient)}
                />
                <span>{ingredient}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hunger Level */}
        <div className="hunger-section">
          <h3>How Hungry Are You?</h3>
          <label className="hunger-toggle">
            <input
              type="checkbox"
              checked={context.viewModel.isHungry}
              onChange={(e) => context.sendMessage('setHungry', e.target.checked)}
            />
            <span>Very Hungry (Double Portion)</span>
          </label>
        </div>

        {/* Create Button */}
        <button
          className={`create-button ${!context.viewModel.canCreateBurger ? 'disabled' : ''}`}
          disabled={!context.viewModel.canCreateBurger}
          onClick={() => context.sendMessage('createBurger')}
        >
          Create Burger
        </button>

        {/* Load Data Button */}
        <button
          className="load-button"
          onClick={() => context.sendMessage('loadData')}
        >
          Refresh Data
        </button>

        {/* Burger List */}
        {context.viewModel.burgers.length > 0 && (
          <div className="burger-list">
            <h3>Your Burgers</h3>
            {context.viewModel.burgers.map(burger => (
              <div key={burger.id} className="burger-item">
                <div className="burger-info">
                  <span className="burger-id">#{burger.id}</span>
                  <span className={`burger-state ${burger.state.toLowerCase()}`}>
                    {burger.state}
                  </span>
                  <span className="burger-ingredients">
                    {burger.ingredients?.join(', ') || 'No ingredients'}
                  </span>
                </div>
                <div className="burger-actions">
                  {burger.state === 'READY' && (
                    <button
                      className="eat-button"
                      onClick={() => context.sendMessage('eatBurger', burger.id)}
                    >
                      Eat
                    </button>
                  )}
                  <button
                    className="trash-button"
                    onClick={() => context.sendMessage('trashBurger', burger.id)}
                  >
                    Trash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin Section */}
        <div className="admin-section">
          <button
            className="admin-toggle"
            onClick={() => context.sendMessage('toggleAdmin')}
          >
            {context.viewModel.showAdmin ? 'Hide Admin' : 'Show Admin'}
          </button>
          
          {context.viewModel.showAdmin && (
            <div className="admin-panel">
              <h3>Admin Panel</h3>
              <div className="admin-input">
                <input
                  type="password"
                  placeholder="Admin Key"
                  value={context.viewModel.adminKey}
                  onChange={(e) => context.sendMessage('setAdminKey', e.target.value)}
                />
              </div>
              <div className="admin-actions">
                <button
                  className="clear-register-button"
                  onClick={() => context.sendMessage('clearRegister')}
                >
                  Clear Register
                </button>
                <button
                  className="clear-burgers-button"
                  onClick={() => context.sendMessage('clearBurgers')}
                >
                  Clear All Burgers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ))
  .withState('error', (context) => (
    <div className="burger-creation-container error-state">
      <div className="error-display">
        <h2>Error</h2>
        <p>{context.viewModel.error}</p>
        <button onClick={() => context.sendMessage('clearError')}>Clear Error</button>
        <button onClick={() => context.sendMessage('loadData')}>Retry</button>
      </div>
    </div>
  ))
  .withState('creating', (context) => (
    <div className="burger-creation-container">
      <div className="creating-state">
        <div className="loading-spinner">Creating your burger...</div>
        <p>Please wait while we prepare your delicious fish burger!</p>
      </div>
    </div>
  ))
  .withState('success', (context) => (
    <div className="burger-creation-container">
      <div className="success-state">
        <div className="success-icon">✓</div>
        <h2>Burger Created Successfully!</h2>
        <p>{context.viewModel.successMessage}</p>
        <button onClick={() => context.sendMessage('loadData')}>Continue</button>
      </div>
    </div>
  ));

  // Get the current view model
  const viewModel = burgerCreationMachine.getViewModel();

  return (
    <div className="burger-creation-wrapper">
      {viewMachine.render({
        viewModel,
        config: { machineId: 'burger-creation-view' },
        currentState: viewModel.currentState,
        sendMessage: (message: string, payload?: any) => burgerCreationMachine.sendMessage(message, payload),
        transition: (state: string) => burgerCreationMachine.transition(state)
      })}
    </div>
  );
};

export default BurgerCreationUI; 
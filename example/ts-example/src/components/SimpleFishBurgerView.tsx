import React from 'react';
import { createSimpleFishBurgerView } from '../machines/SimpleFishBurgerViewStateMachine';
import { createViewStateMachine } from '../core/ViewStateMachine';

const SimpleFishBurgerView: React.FC = () => {
  // Create the state machine
  const burgerMachine = createSimpleFishBurgerView({
    machineId: 'simple-fish-burger'
  });

  // Create the view state machine with state-specific rendering
  const viewMachine = createViewStateMachine({
    machineId: 'simple-fish-burger-view',
    states: {
      initial: {},
      loading: {},
      ready: {},
      error: {},
      creating: {},
      eating: {},
      trashing: {},
      empty: {}
    },
    defaultViewModel: burgerMachine.getViewModel(),
    defaultConfig: { machineId: 'simple-fish-burger-view' }
  })
  .withState('initial', (context) => (
    <div className="simple-fish-burger-container">
      <div className="loading-spinner">Initializing...</div>
    </div>
  ))
  .withState('loading', (context) => (
    <div className="simple-fish-burger-container">
      <div className="loading-spinner">Loading...</div>
    </div>
  ))
  .withState('ready', (context) => (
    <div className="simple-fish-burger-container">
      {/* Error Banner */}
      {context.viewModel.error && (
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

      {/* Main Content */}
      <div className="fish-burger-content">
        <h2>Simple Fish Burger</h2>
        
        {/* Actions */}
        <div className="burger-actions">
          <button
            className="create-button"
            onClick={() => context.sendMessage('createBurger')}
            disabled={context.viewModel.loading || !context.viewModel.canCreateBurger}
          >
            {context.viewModel.loading ? 'Creating...' : 'Create Burger'}
          </button>

          <button
            className="refresh-button"
            onClick={() => context.sendMessage('loadBurgers')}
            disabled={context.viewModel.loading}
          >
            Refresh
          </button>
        </div>

        {/* Burger List */}
        {context.viewModel.showBurgerList && context.viewModel.burgers.length > 0 && (
          <div className="burger-list">
            <h3>Your Burgers ({context.viewModel.totalBurgers})</h3>
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
                  {burger.totalCost && (
                    <span className="burger-cost">${burger.totalCost.toFixed(2)}</span>
                  )}
                </div>
                <div className="burger-actions">
                  {burger.state === 'READY' && (
                    <button
                      className="eat-button"
                      onClick={() => {
                        context.viewModel.lastPayload = burger.id;
                        context.sendMessage('eatBurger', burger.id);
                      }}
                      disabled={context.viewModel.loading}
                    >
                      Eat
                    </button>
                  )}
                  <button
                    className="trash-button"
                    onClick={() => {
                      context.viewModel.lastPayload = burger.id;
                      context.sendMessage('trashBurger', burger.id);
                    }}
                    disabled={context.viewModel.loading || burger.state === 'EAT'}
                  >
                    Trash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Burger Categories */}
        <div className="burger-categories">
          <div className="category-section">
            <h3>Ready to Eat ({context.viewModel.readyBurgers.length})</h3>
            {context.viewModel.readyBurgers.map(burger => (
              <div key={burger.id} className="category-burger ready">
                #{burger.id} - {burger.state}
              </div>
            ))}
          </div>

          <div className="category-section">
            <h3>Cooking ({context.viewModel.cookingBurgers.length})</h3>
            {context.viewModel.cookingBurgers.map(burger => (
              <div key={burger.id} className="category-burger cooking">
                #{burger.id} - {burger.state}
              </div>
            ))}
          </div>

          <div className="category-section">
            <h3>Eaten ({context.viewModel.eatenBurgers.length})</h3>
            {context.viewModel.eatenBurgers.map(burger => (
              <div key={burger.id} className="category-burger eaten">
                #{burger.id} - {burger.state}
              </div>
            ))}
          </div>

          <div className="category-section">
            <h3>Trashed ({context.viewModel.trashedBurgers.length})</h3>
            {context.viewModel.trashedBurgers.map(burger => (
              <div key={burger.id} className="category-burger trashed">
                #{burger.id} - {burger.state}
              </div>
            ))}
          </div>
        </div>

        {/* Status Information */}
        <div className="status-info">
          <h3>Status Information</h3>
          <div className="status-grid">
            <div className="status-item">
              <label>Current State:</label>
              <span className={`state-badge ${context.viewModel.currentState.toLowerCase()}`}>
                {context.viewModel.currentState}
              </span>
            </div>
            <div className="status-item">
              <label>Total Burgers:</label>
              <span>{context.viewModel.totalBurgers}</span>
            </div>
            <div className="status-item">
              <label>Can Create:</label>
              <span>{context.viewModel.canCreateBurger ? 'Yes' : 'No'}</span>
            </div>
            <div className="status-item">
              <label>Can Eat:</label>
              <span>{context.viewModel.canEatBurger ? 'Yes' : 'No'}</span>
            </div>
            <div className="status-item">
              <label>Can Trash:</label>
              <span>{context.viewModel.canTrashBurger ? 'Yes' : 'No'}</span>
            </div>
            <div className="status-item">
              <label>Last Action:</label>
              <span>
                {context.viewModel.lastActionTime ? 
                  new Date(context.viewModel.lastActionTime).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ))
  .withState('error', (context) => (
    <div className="simple-fish-burger-container error-state">
      <div className="error-display">
        <h2>Error</h2>
        <p>{context.viewModel.error}</p>
        <button onClick={() => context.sendMessage('clearError')}>Clear Error</button>
        <button onClick={() => context.sendMessage('loadBurgers')}>Retry</button>
      </div>
    </div>
  ))
  .withState('creating', (context) => (
    <div className="simple-fish-burger-container">
      <div className="creating-state">
        <div className="loading-spinner">Creating your fish burger...</div>
        <p>Please wait while we prepare your delicious fish burger!</p>
      </div>
    </div>
  ))
  .withState('eating', (context) => (
    <div className="simple-fish-burger-container">
      <div className="eating-state">
        <div className="loading-spinner">Eating your burger...</div>
        <p>Nom nom nom! Enjoying your fish burger!</p>
      </div>
    </div>
  ))
  .withState('trashing', (context) => (
    <div className="simple-fish-burger-container">
      <div className="trashing-state">
        <div className="loading-spinner">Disposing of burger...</div>
        <p>Cleaning up the burger...</p>
      </div>
    </div>
  ))
  .withState('empty', (context) => (
    <div className="simple-fish-burger-container">
      <div className="empty-state">
        <h2>No Burgers Yet</h2>
        <p>Create your first fish burger to get started!</p>
        <button
          onClick={() => context.sendMessage('createBurger')}
          disabled={context.viewModel.loading}
        >
          Create First Burger
        </button>
      </div>
    </div>
  ));

  // Get the current view model
  const viewModel = burgerMachine.getViewModel();

  return (
    <div className="simple-fish-burger-wrapper">
      {viewMachine.render({
        viewModel,
        config: { machineId: 'simple-fish-burger-view' },
        currentState: viewModel.currentState,
        sendMessage: (message: string, payload?: any) => burgerMachine.sendMessage(message, payload),
        transition: (state: string) => burgerMachine.transition(state)
      })}
    </div>
  );
};

export default SimpleFishBurgerView; 
import React from 'react';
import { createBurgerCreationView } from '../machines/BurgerCreationViewStateMachine';

const BurgerCreationUI: React.FC = () => {
  // Create the state machine
  const burgerCreationMachine = createBurgerCreationView({
    machineId: 'burger-creation',
    adminKey: 'admin123'
  });

  // Get the current view model
  const viewModel = burgerCreationMachine.getViewModel();

  const handleSendMessage = (message: string, payload?: any) => {
    burgerCreationMachine.sendMessage(message, payload);
    // Force a re-render by calling setState on the parent component
    // For now, we'll just update the view model and let React handle it
  };

  return (
    <div className="burger-creation-wrapper">
      <div className="burger-creation-container">
        {/* Error Banner */}
        {viewModel.showErrorBanner && (
          <div className="error-banner">
            <span>{viewModel.error}</span>
            <button onClick={() => handleSendMessage('clearError')}>×</button>
          </div>
        )}

        {/* Success Message */}
        {viewModel.showSuccessMessage && (
          <div className="success-message">
            <span>{viewModel.successMessage}</span>
            <button onClick={() => handleSendMessage('clearSuccess')}>×</button>
          </div>
        )}

        {/* Loading Spinner */}
        {viewModel.showLoadingSpinner && (
          <div className="loading-overlay">
            <div className="loading-spinner">Processing...</div>
          </div>
        )}

        {/* Main Content */}
        <div className="burger-creation-content">
          <h2>Create Your Tasty Fish Burger</h2>
          
          {/* Register Display */}
          {viewModel.register && (
            <div className="register-display">
              <h3>Register: ${viewModel.register.total}</h3>
              <p>Burgers Sold: {viewModel.register.burgerCount}</p>
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
                    checked={viewModel.selectedIngredients.includes(ingredient)}
                    onChange={() => handleSendMessage('toggleIngredient', ingredient)}
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
                checked={viewModel.isHungry}
                onChange={(e) => handleSendMessage('setHungry', e.target.checked)}
              />
              <span>Very Hungry (Double Portion)</span>
            </label>
          </div>

          {/* Create Button */}
          <button
            className={`create-button ${!viewModel.canCreateBurger ? 'disabled' : ''}`}
            disabled={!viewModel.canCreateBurger}
            onClick={() => handleSendMessage('createBurger')}
          >
            Create Burger
          </button>

          {/* Load Data Button */}
          <button
            className="load-button"
            onClick={() => handleSendMessage('loadData')}
          >
            Refresh Data
          </button>

          {/* Burger List */}
          {viewModel.burgers.length > 0 && (
            <div className="burger-list">
              <h3>Your Burgers</h3>
              {viewModel.burgers.map(burger => (
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
                        onClick={() => handleSendMessage('eatBurger', burger.id)}
                      >
                        Eat
                      </button>
                    )}
                    <button
                      className="trash-button"
                      onClick={() => handleSendMessage('trashBurger', burger.id)}
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
              onClick={() => handleSendMessage('toggleAdmin')}
            >
              {viewModel.showAdmin ? 'Hide Admin' : 'Show Admin'}
            </button>
            
            {viewModel.showAdmin && (
              <div className="admin-panel">
                <h3>Admin Panel</h3>
                <div className="admin-input">
                  <input
                    type="password"
                    placeholder="Admin Key"
                    value={viewModel.adminKey}
                    onChange={(e) => handleSendMessage('setAdminKey', e.target.value)}
                  />
                </div>
                <div className="admin-actions">
                  <button
                    className="clear-register-button"
                    onClick={() => handleSendMessage('clearRegister')}
                  >
                    Clear Register
                  </button>
                  <button
                    className="clear-burgers-button"
                    onClick={() => handleSendMessage('clearBurgers')}
                  >
                    Clear All Burgers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurgerCreationUI; 
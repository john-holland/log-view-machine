import React, { useState } from 'react';
import './SelectorInput.css';

interface SelectorInputProps {
  initialSelector?: string;
  onSelectorChange?: (selector: string) => void;
  onGo?: () => void;
  onStop?: () => void;
  going?: boolean;
  className?: string;
}

const SelectorInput: React.FC<SelectorInputProps> = ({
  initialSelector = 'p',
  onSelectorChange,
  onGo,
  onStop,
  going = false,
  className = ''
}) => {
  const [selector, setSelector] = useState(initialSelector);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialSelector);

  const handleSelectorChange = (newSelector: string) => {
    setSelector(newSelector);
    onSelectorChange?.(newSelector);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditValue(selector);
  };

  const handleSave = () => {
    handleSelectorChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(selector);
    setIsEditing(false);
  };

  const handleGo = () => {
    if (onGo) {
      onGo();
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  return (
    <div className={`selector-input ${className}`}>
      <div className="selector-header">
        <h2>🎯 CSS Selector</h2>
        <p>Enter a CSS selector to target elements on the page</p>
      </div>

      <div className="selector-content">
        <div className="selector-display">
          {isEditing ? (
            <div className="selector-edit">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="e.g., p, h1, .content, #main"
                className="selector-input-field"
                autoFocus
              />
              <div className="selector-edit-actions">
                <button onClick={handleSave} className="btn btn-primary">
                  💾 Save
                </button>
                <button onClick={handleCancel} className="btn btn-secondary">
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="selector-display-content" onClick={handleStartEditing}>
              <span className="selector-text">{selector}</span>
              <span className="edit-hint">(click to edit)</span>
            </div>
          )}
        </div>

        <div className="selector-controls">
          <div className="control-buttons">
            <button
              onClick={handleGo}
              disabled={going}
              className={`btn btn-primary ${going ? 'going' : ''}`}
            >
              {going ? '🌊 Running...' : '🚀 Start'}
            </button>
            <button
              onClick={handleStop}
              disabled={!going}
              className="btn btn-danger"
            >
              ⏹️ Stop
            </button>
          </div>
        </div>

        <div className="selector-info">
          <h4>Common Selectors:</h4>
          <div className="selector-examples">
            <span className="example">p</span>
            <span className="example">h1, h2, h3</span>
            <span className="example">.class-name</span>
            <span className="example">#id-name</span>
            <span className="example">div &gt; p</span>
            <span className="example">[data-testid]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectorInput;

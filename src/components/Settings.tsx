import React, { useState } from 'react';

interface Setting {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: any;
  options?: string[];
  description?: string;
  category: 'general' | 'tracing' | 'performance' | 'ui';
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([
    {
      key: 'serviceName',
      label: 'Service Name',
      type: 'text',
      value: 'tome-connector-editor',
      description: 'Name of the service for OpenTelemetry tracing',
      category: 'general'
    },
    {
      key: 'enableStackTraces',
      label: 'Enable Stack Traces',
      type: 'boolean',
      value: true,
      description: 'Capture and display stack traces for errors',
      category: 'tracing'
    },
    {
      key: 'maxStackTraceDepth',
      label: 'Max Stack Trace Depth',
      type: 'number',
      value: 10,
      description: 'Maximum depth to parse in stack traces',
      category: 'tracing'
    },
    {
      key: 'samplingRate',
      label: 'Tracing Sampling Rate',
      type: 'select',
      value: '1.0',
      options: ['0.1', '0.5', '1.0'],
      description: 'Percentage of traces to sample (1.0 = 100%)',
      category: 'tracing'
    },
    {
      key: 'enableMetrics',
      label: 'Enable Metrics',
      type: 'boolean',
      value: true,
      description: 'Collect and export performance metrics',
      category: 'performance'
    },
    {
      key: 'enableLogs',
      label: 'Enable Logs',
      type: 'boolean',
      value: true,
      description: 'Collect and export application logs',
      category: 'performance'
    },
    {
      key: 'otelEndpoint',
      label: 'OpenTelemetry Endpoint',
      type: 'text',
      value: 'http://localhost:4318',
      description: 'OTLP endpoint for telemetry data',
      category: 'tracing'
    },
    {
      key: 'theme',
      label: 'Theme',
      type: 'select',
      value: 'light',
      options: ['light', 'dark', 'auto'],
      description: 'Application theme preference',
      category: 'ui'
    },
    {
      key: 'autoSave',
      label: 'Auto Save',
      type: 'boolean',
      value: true,
      description: 'Automatically save changes',
      category: 'ui'
    }
  ]);

  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would save to localStorage or backend
    localStorage.setItem('tome-connector-settings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    console.log('Settings saved:', settings);
  };

  const handleReset = () => {
    // Reset to default values
    setSettings(prev => 
      prev.map(setting => ({
        ...setting,
        value: getDefaultValue(setting.key)
      }))
    );
    setHasUnsavedChanges(true);
  };

  const getDefaultValue = (key: string): any => {
    const defaults: Record<string, any> = {
      serviceName: 'tome-connector-editor',
      enableStackTraces: true,
      maxStackTraceDepth: 10,
      samplingRate: '1.0',
      enableMetrics: true,
      enableLogs: true,
      otelEndpoint: 'http://localhost:4318',
      theme: 'light',
      autoSave: true
    };
    return defaults[key];
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        );
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const categories = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'tracing', label: 'Tracing', icon: '🔍' },
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'ui', label: 'Interface', icon: '🎨' }
  ];

  const filteredSettings = settings.filter(setting => setting.category === activeCategory);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Configure your TomeConnector Studio preferences and system settings</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <h3>Categories</h3>
          <div className="category-list">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-main">
          <div className="category-header">
            <h3>{categories.find(c => c.id === activeCategory)?.label} Settings</h3>
            <p>Configure {categories.find(c => c.id === activeCategory)?.label.toLowerCase()} preferences</p>
          </div>

          <div className="settings-form">
            {filteredSettings.map(setting => (
              <div key={setting.key} className="setting-item">
                <div className="setting-label">
                  <label htmlFor={setting.key}>{setting.label}</label>
                  {setting.description && (
                    <span className="setting-description">{setting.description}</span>
                  )}
                </div>
                <div className="setting-input">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="save-button"
            >
              💾 Save Changes
            </button>
            <button
              onClick={handleReset}
              className="reset-button"
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .settings-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .settings-header h2 {
          font-size: 2rem;
          margin-bottom: 10px;
          color: #333;
        }

        .settings-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .settings-content {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 30px;
        }

        .settings-sidebar {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          height: fit-content;
        }

        .settings-sidebar h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .category-button:hover {
          background: #e9ecef;
        }

        .category-button.active {
          background: #007bff;
          color: white;
        }

        .category-icon {
          font-size: 1.2rem;
        }

        .settings-main {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .category-header {
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .category-header h3 {
          font-size: 1.5rem;
          margin-bottom: 5px;
          color: #333;
        }

        .category-header p {
          color: #666;
        }

        .settings-form {
          margin-bottom: 30px;
        }

        .setting-item {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-label label {
          display: block;
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .setting-description {
          display: block;
          font-size: 0.9rem;
          color: #666;
          line-height: 1.4;
        }

        .setting-input {
          display: flex;
          align-items: center;
        }

        .settings-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }

        .save-button, .reset-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .save-button {
          background: #28a745;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #218838;
        }

        .save-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .reset-button {
          background: #6c757d;
          color: white;
        }

        .reset-button:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .settings-content {
            grid-template-columns: 1fr;
          }
          
          .setting-item {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;

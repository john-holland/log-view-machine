import React, { useState, useEffect } from 'react';
import Settings from './Settings';
import About from './About';
import SelectorInput from './SelectorInput';
import './WaveTabs.css';

interface Tab {
  id: string;
  label: string;
  icon: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface WaveTabsProps {
  initialActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

const WaveTabs: React.FC<WaveTabsProps> = ({
  initialActiveTab = 'selector',
  onTabChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [tabHistory, setTabHistory] = useState<string[]>([initialActiveTab]);

  // Define the tabs with their content
  const tabs: Tab[] = [
    {
      id: 'selector',
      label: 'Selector',
      icon: '🎯',
      content: <SelectorInput />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      content: <Settings />
    },
    {
      id: 'about',
      label: 'About',
      icon: 'ℹ️',
      content: <About />
    }
  ];

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    
    setActiveTab(tabId);
    setTabHistory(prev => [...prev, tabId]);
    onTabChange?.(tabId);
  };

  // Handle back navigation
  const handleBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = tabHistory.slice(0, -1);
      const previousTab = newHistory[newHistory.length - 1];
      setActiveTab(previousTab);
      setTabHistory(newHistory);
      onTabChange?.(previousTab);
    }
  };

  // Get current tab data
  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Update active tab when initialActiveTab changes
  useEffect(() => {
    if (initialActiveTab && initialActiveTab !== activeTab) {
      setActiveTab(initialActiveTab);
      setTabHistory([initialActiveTab]);
    }
  }, [initialActiveTab]);

  return (
    <div className={`wave-tabs ${className}`}>
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              disabled={tab.disabled}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Navigation Controls */}
        <div className="tab-controls">
          {tabHistory.length > 1 && (
            <button
              onClick={handleBack}
              className="back-button"
              title="Go back"
            >
              ← Back
            </button>
          )}
          
          <div className="tab-indicator">
            <span className="tab-count">{tabs.length} tabs</span>
            <span className="active-tab">{activeTab}</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {currentTab ? (
          <div className="tab-pane active">
            {currentTab.content}
          </div>
        ) : (
          <div className="tab-pane">
            <p>Tab content not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveTabs;

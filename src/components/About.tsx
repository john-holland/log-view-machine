import React, { useState } from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
  status: 'ready' | 'beta' | 'coming-soon';
}

interface Technology {
  name: string;
  version: string;
  description: string;
  url: string;
}

const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const features: Feature[] = [
    {
      icon: '🔗',
      title: 'TomeConnector',
      description: 'Connect state machines with RobotCopy message broker and distributed tracing',
      status: 'ready'
    },
    {
      icon: '🏗️',
      title: 'Structural System',
      description: 'Organize applications with routing, navigation, and component mapping',
      status: 'ready'
    },
    {
      icon: '📊',
      title: 'OpenTelemetry Integration',
      description: 'Monitor performance with distributed tracing, metrics, and logs',
      status: 'ready'
    },
    {
      icon: '🔍',
      title: 'Stack Trace Capture',
      description: 'Advanced error tracking with stack trace correlation and analysis',
      status: 'ready'
    },
    {
      icon: '🤖',
      title: 'RobotCopy Message Broker',
      description: 'Reliable message routing and state machine communication',
      status: 'ready'
    },
    {
      icon: '🐳',
      title: 'Container Ready',
      description: 'Deploy anywhere with Docker and Kubernetes support',
      status: 'ready'
    },
    {
      icon: '📱',
      title: 'Progressive Web App',
      description: 'Install as a native app on any device',
      status: 'beta'
    },
    {
      icon: '🧠',
      title: 'AI-Powered Insights',
      description: 'Machine learning for performance optimization and error prediction',
      status: 'coming-soon'
    }
  ];

  const technologies: Technology[] = [
    {
      name: 'React',
      version: '18.x',
      description: 'Modern UI framework for building interactive interfaces',
      url: 'https://reactjs.org'
    },
    {
      name: 'TypeScript',
      version: '5.x',
      description: 'Type-safe JavaScript for better development experience',
      url: 'https://typescriptlang.org'
    },
    {
      name: 'XState',
      version: '4.x',
      description: 'State machine library for complex state management',
      url: 'https://xstate.js.org'
    },
    {
      name: 'OpenTelemetry',
      version: '1.x',
      description: 'Observability framework for distributed tracing',
      url: 'https://opentelemetry.io'
    },
    {
      name: 'Express.js',
      version: '4.x',
      description: 'Fast, unopinionated web framework for Node.js',
      url: 'https://expressjs.com'
    },
    {
      name: 'Docker',
      version: 'Latest',
      description: 'Container platform for consistent deployment',
      url: 'https://docker.com'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'technology', label: 'Technology', icon: '🔧' },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' }
  ];

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      'ready': { color: 'bg-green-100 text-green-800', text: '✅ Ready' },
      'beta': { color: 'bg-yellow-100 text-yellow-800', text: '🟡 Beta' },
      'coming-soon': { color: 'bg-gray-100 text-gray-800', text: '⏳ Coming Soon' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="hero-section">
        <h2>🚀 Welcome to TomeConnector Studio</h2>
        <p className="hero-description">
          A powerful platform for building connected, observable applications with state machines and distributed tracing.
          TomeConnector Studio combines the best of modern web technologies with enterprise-grade observability.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">6+</div>
          <div className="stat-label">Core Features</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">100%</div>
          <div className="stat-label">Open Source</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Monitoring</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">∞</div>
          <div className="stat-label">Scalability</div>
        </div>
      </div>

      <div className="mission-section">
        <h3>🎯 Our Mission</h3>
        <p>
          To democratize enterprise-grade observability and state management, making it accessible to developers 
          of all skill levels. We believe that every application deserves to be observable, debuggable, and maintainable.
        </p>
      </div>

      <div className="values-section">
        <h3>💎 Core Values</h3>
        <div className="values-grid">
          <div className="value-item">
            <h4>🔍 Transparency</h4>
            <p>Complete visibility into application behavior and performance</p>
          </div>
          <div className="value-item">
            <h4>🔄 Reliability</h4>
            <p>Robust state management and error handling</p>
          </div>
          <div className="value-item">
            <h4>🚀 Performance</h4>
            <p>Optimized for speed and efficiency</p>
          </div>
          <div className="value-item">
            <h4>🤝 Community</h4>
            <p>Built by developers, for developers</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="features-content">
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-header">
              <span className="feature-icon">{feature.icon}</span>
              <h3 className="feature-title">{feature.title}</h3>
            </div>
            <p className="feature-description">{feature.description}</p>
            <div className="feature-status">
              {renderStatusBadge(feature.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTechnology = () => (
    <div className="technology-content">
      <div className="tech-intro">
        <h3>🔧 Built with Modern Technologies</h3>
        <p>
          TomeConnector Studio leverages cutting-edge technologies to provide a robust, scalable, 
          and developer-friendly platform for building observable applications.
        </p>
      </div>

      <div className="tech-grid">
        {technologies.map((tech, index) => (
          <div key={index} className="tech-card">
            <div className="tech-header">
              <h4 className="tech-name">{tech.name}</h4>
              <span className="tech-version">{tech.version}</span>
            </div>
            <p className="tech-description">{tech.description}</p>
            <a 
              href={tech.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="tech-link"
            >
              Learn More →
            </a>
          </div>
        ))}
      </div>

      <div className="architecture-section">
        <h3>🏗️ Architecture Overview</h3>
        <div className="architecture-diagram">
          <div className="arch-layer">
            <h4>Frontend Layer</h4>
            <p>React + TypeScript + XState</p>
          </div>
          <div className="arch-layer">
            <h4>API Layer</h4>
            <p>Express.js + GraphQL</p>
          </div>
          <div className="arch-layer">
            <h4>State Management</h4>
            <p>ViewStateMachine + RobotCopy</p>
          </div>
          <div className="arch-layer">
            <h4>Observability</h4>
            <p>OpenTelemetry + Prometheus + Grafana</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGettingStarted = () => (
    <div className="getting-started-content">
      <div className="quick-start">
        <h3>⚡ Quick Start</h3>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Clone the Repository</h4>
              <code>git clone https://github.com/your-org/tome-connector-studio.git</code>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Install Dependencies</h4>
              <code>npm install</code>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Start Development Server</h4>
              <code>npm run start:dev</code>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Open in Browser</h4>
              <code>http://localhost:3000</code>
            </div>
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h3>🎯 Next Steps</h3>
        <div className="next-steps-grid">
          <div className="next-step-card">
            <h4>📚 Read the Documentation</h4>
            <p>Explore our comprehensive guides and API references</p>
            <a href="#" className="next-step-link">View Docs →</a>
          </div>
          <div className="next-step-card">
            <h4>🔗 Try Tome Integration</h4>
            <p>Experience the power of connected state machines</p>
            <a href="/tome-integration" className="next-step-link">Start Demo →</a>
          </div>
          <div className="next-step-card">
            <h4>🏗️ Explore Structure</h4>
            <p>Learn about our structural system and routing</p>
            <a href="/structural" className="next-step-link">View Structure →</a>
          </div>
          <div className="next-step-card">
            <h4>⚙️ Configure Settings</h4>
            <p>Customize your development environment</p>
            <a href="/settings" className="next-step-link">Open Settings →</a>
          </div>
        </div>
      </div>

      <div className="support-section">
        <h3>💬 Need Help?</h3>
        <div className="support-options">
          <div className="support-option">
            <h4>📖 Documentation</h4>
            <p>Comprehensive guides and examples</p>
          </div>
          <div className="support-option">
            <h4>🐛 Issue Tracker</h4>
            <p>Report bugs and request features</p>
          </div>
          <div className="support-option">
            <h4>💬 Community</h4>
            <p>Join our developer community</p>
          </div>
          <div className="support-option">
            <h4>📧 Support</h4>
            <p>Get help from our team</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="about-container">
      <div className="about-header">
        <h1>ℹ️ About TomeConnector Studio</h1>
        <p>Learn more about the platform, its features, and how to get started</p>
      </div>

      <div className="about-content">
        <div className="about-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'features' && renderFeatures()}
          {activeTab === 'technology' && renderTechnology()}
          {activeTab === 'getting-started' && renderGettingStarted()}
        </div>
      </div>

      <style jsx>{`
        .about-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .about-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .about-header h1 {
          font-size: 2.5rem;
          margin-bottom: 15px;
          color: #333;
        }

        .about-header p {
          color: #666;
          font-size: 1.2rem;
        }

        .about-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .about-tabs {
          display: flex;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .tab-button:hover {
          background: #e9ecef;
        }

        .tab-button.active {
          background: white;
          border-bottom-color: #007bff;
          color: #007bff;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-content {
          padding: 40px;
        }

        /* Overview Styles */
        .hero-section {
          text-align: center;
          margin-bottom: 40px;
        }

        .hero-section h2 {
          font-size: 2rem;
          margin-bottom: 20px;
          color: #333;
        }

        .hero-description {
          font-size: 1.1rem;
          color: #666;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          text-align: center;
          padding: 30px 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid #e9ecef;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }

        .stat-label {
          color: #666;
          font-weight: 600;
        }

        .mission-section, .values-section {
          margin-bottom: 40px;
        }

        .mission-section h3, .values-section h3 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #333;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .value-item {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .value-item h4 {
          margin-bottom: 10px;
          color: #333;
        }

        .value-item p {
          color: #666;
        }

        /* Features Styles */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }

        .feature-card {
          padding: 25px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .feature-icon {
          font-size: 2rem;
        }

        .feature-title {
          font-size: 1.3rem;
          color: #333;
          margin: 0;
        }

        .feature-description {
          color: #666;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .feature-status {
          display: flex;
          justify-content: flex-end;
        }

        /* Technology Styles */
        .tech-intro {
          text-align: center;
          margin-bottom: 40px;
        }

        .tech-intro h3 {
          font-size: 1.8rem;
          margin-bottom: 15px;
          color: #333;
        }

        .tech-intro p {
          color: #666;
          font-size: 1.1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }

        .tech-card {
          padding: 25px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .tech-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .tech-name {
          font-size: 1.3rem;
          color: #333;
          margin: 0;
        }

        .tech-version {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .tech-description {
          color: #666;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .tech-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 600;
        }

        .tech-link:hover {
          text-decoration: underline;
        }

        .architecture-section {
          text-align: center;
        }

        .architecture-section h3 {
          font-size: 1.8rem;
          margin-bottom: 30px;
          color: #333;
        }

        .architecture-diagram {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-width: 600px;
          margin: 0 auto;
        }

        .arch-layer {
          padding: 20px;
          background: #e3f2fd;
          border-radius: 8px;
          border: 2px solid #2196f3;
        }

        .arch-layer h4 {
          margin: 0 0 10px 0;
          color: #1976d2;
        }

        .arch-layer p {
          margin: 0;
          color: #424242;
        }

        /* Getting Started Styles */
        .quick-start {
          margin-bottom: 40px;
        }

        .quick-start h3 {
          font-size: 1.8rem;
          margin-bottom: 25px;
          color: #333;
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        .step-number {
          background: #007bff;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .step-content h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .step-content code {
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          color: #e83e8c;
        }

        .next-steps {
          margin-bottom: 40px;
        }

        .next-steps h3 {
          font-size: 1.8rem;
          margin-bottom: 25px;
          color: #333;
        }

        .next-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .next-step-card {
          padding: 25px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          text-align: center;
        }

        .next-step-card h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .next-step-card p {
          color: #666;
          margin-bottom: 20px;
        }

        .next-step-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 600;
        }

        .next-step-link:hover {
          text-decoration: underline;
        }

        .support-section h3 {
          font-size: 1.8rem;
          margin-bottom: 25px;
          color: #333;
          text-align: center;
        }

        .support-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .support-option {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          text-align: center;
        }

        .support-option h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .support-option p {
          color: #666;
          margin: 0;
        }

        @media (max-width: 768px) {
          .about-tabs {
            flex-direction: column;
          }
          
          .tab-button {
            justify-content: center;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .values-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default About;

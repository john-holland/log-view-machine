import { openTelemetryManager } from '../opentelemetry-setup';

// Example demonstrating stack trace capture and correlation with OpenTelemetry
export class StackTraceExample {
  
  async demonstrateStackTraceCapture(): Promise<void> {
    console.log('🚀 Starting Stack Trace Demo...\n');
    
    try {
      // Initialize OpenTelemetry
      await openTelemetryManager.initialize();
      
      // Demonstrate basic span creation
      console.log('📊 Creating spans with error handling...');
      const span1 = openTelemetryManager.startSpan('user-authentication');
      span1.setAttributes({
        'user.id': '12345',
        'operation': 'login',
        'timestamp': new Date().toISOString()
      });
      
      // Simulate an error during authentication
      try {
        throw new Error('Invalid credentials provided');
      } catch (error) {
        if (error instanceof Error) {
          // Record the exception in the span
          span1.recordException(error, {
            'user.input': 'john@example.com',
            'retry.count': 0
          });
        }
      }
      
      span1.end();
      
      // Create another span for a different operation
      const span2 = openTelemetryManager.startSpan('data-fetch');
      span2.setAttributes({
        'query.type': 'user_profile',
        'cache.hit': false
      });
      
      // Simulate a different type of error
      try {
        throw new TypeError('Database connection failed');
      } catch (error) {
        if (error instanceof Error) {
          span2.recordException(error, {
            'database.host': 'localhost:5432',
            'connection.timeout': 5000
          });
        }
      }
      
      span2.end();
      
      // Demonstrate error context retrieval
      console.log('\n🔍 Retrieving error contexts...');
      const errorStats = openTelemetryManager.getErrorStats();
      console.log('Error Statistics:', JSON.stringify(errorStats, null, 2));
      
      // Show how to get specific error context
      if (errorStats.recentErrors && errorStats.recentErrors.length > 0) {
        const firstError = errorStats.recentErrors[0];
        console.log('\n📋 First Error Details:');
        console.log(`  Message: ${firstError.message}`);
        console.log(`  Type: ${firstError.type}`);
        console.log(`  File: ${firstError.file}:${firstError.line}`);
        console.log(`  Timestamp: ${firstError.timestamp}`);
      }
      
      // Demonstrate trace context propagation
      console.log('\n🔗 Demonstrating trace context propagation...');
      const traceContext = openTelemetryManager.createTraceContext();
      console.log('Generated Trace Context:', traceContext);
      
      // Show how to extract trace context from headers
      const extractedContext = openTelemetryManager.extractTraceContext(traceContext.headers);
      console.log('Extracted Context:', extractedContext);
      
      console.log('\n✅ Stack Trace Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }
  
  async demonstrateErrorRecovery(): Promise<void> {
    console.log('\n🔄 Demonstrating Error Recovery...');
    
    const span = openTelemetryManager.startSpan('error-recovery-test');
    
    try {
      // Simulate a recoverable error
      throw new Error('Network timeout - retrying...');
    } catch (error) {
      if (error instanceof Error) {
        // Record the error but mark it as recoverable
        span.recordException(error, {
          'error.recoverable': true,
          'retry.strategy': 'exponential_backoff',
          'max.retries': 3
        });
        
        // Simulate recovery
        console.log('🔄 Attempting error recovery...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate recovery time
        
        // Mark as recovered
        span.setAttributes({
          'error.recovered': true,
          'recovery.time_ms': 100
        });
        
        span.setStatus({ code: 1, message: 'Recovered from error' }); // OK status
      }
    }
    
    span.end();
    console.log('✅ Error recovery demonstration completed');
  }
  
  async demonstrateStackTraceDepth(): Promise<void> {
    console.log('\n📚 Demonstrating Stack Trace Depth Control...');
    
    // Create a deep call stack
    const deepFunction = (depth: number): void => {
      if (depth <= 0) {
        throw new Error(`Deep error at depth ${depth}`);
      }
      deepFunction(depth - 1);
    };
    
    const span = openTelemetryManager.startSpan('deep-stack-trace');
    
    try {
      deepFunction(15); // This will create a deep stack
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error, {
          'stack.depth': 15,
          'max.depth': openTelemetryManager.getConfig().maxStackTraceDepth
        });
      }
    }
    
    span.end();
    
    // Show the captured error
    const errorStats = openTelemetryManager.getErrorStats();
    const deepError = errorStats.recentErrors?.find(e => e.message.includes('Deep error'));
    if (deepError) {
      console.log('📋 Deep Stack Error Captured:');
      console.log(`  Message: ${deepError.message}`);
      console.log(`  File: ${deepError.file}:${deepError.line}`);
    }
  }
  
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    openTelemetryManager.clearErrorRegistry();
    await openTelemetryManager.shutdown();
    console.log('✅ Cleanup completed');
  }
}

// Factory function
export function createStackTraceExample(): StackTraceExample {
  return new StackTraceExample();
}

// Example usage - commented out for Jest compatibility
// if (typeof import !== 'undefined' && import.meta && import.meta.url === `file://${process.argv[1]}`) {
//   const example = createStackTraceExample();
//   
//   example.demonstrateStackTraceCapture()
//     .then(() => example.demonstrateErrorRecovery())
//     .then(() => example.demonstrateStackTraceDepth())
//     .then(() => example.cleanup())
//     .catch(console.error);
// }

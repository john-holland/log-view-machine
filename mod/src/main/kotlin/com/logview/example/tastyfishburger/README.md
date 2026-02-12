# Fish Burger Backend with ViewStateMachines and Log-View-Model

This implementation demonstrates a backend for the fish burger system using ViewStateMachines and log-view-model for communication and state persistence.

## Architecture

### Core Components

1. **BaseStateMachine** - Abstract base class for state machines
2. **ViewStateMachine** - Fluent API wrapper around state machines
3. **LogViewMachine** - Log management and filtering system
4. **TastyFishBurgerStateMachine** - Concrete fish burger implementation

### Key Features

- **Fluent API**: ViewStateMachine provides a fluent interface similar to the TypeScript version
- **Log Management**: Comprehensive logging with filtering and real-time updates
- **State Persistence**: State transitions are logged and persisted
- **GraphQL Integration**: State machines can be queried via GraphQL
- **Message Passing**: Asynchronous message passing between components

## Usage

### Basic State Machine

```kotlin
val stateMachine = TastyFishBurgerStateMachine()
val adapter = TastyFishBurgerAdapter(stateMachine)

// Start cooking
stateMachine.startCooking("ORDER-001", listOf("fish", "lettuce", "tomato"))

// Update progress
stateMachine.updateCookingProgress("ORDER-001", 60, 180.0)

// Complete cooking
stateMachine.completeCooking("ORDER-001")
```

### ViewStateMachine Fluent API

```kotlin
val viewStateMachine = stateMachine.getViewStateMachine()

// Execute state with fluent logging
viewStateMachine.executeState("processing", fishBurgerData)

// Get logs
val logs = viewStateMachine.getLogEntries()
```

### Log Management

```kotlin
val logViewMachine = stateMachine.getLogViewMachine()

// Add logs
logViewMachine.addLog(LogEntry(
    id = "",
    timestamp = Instant.EPOCH,
    level = "INFO",
    message = "Cooking started",
    metadata = mapOf("orderId" to "ORDER-001"),
    tags = listOf("cooking", "start")
))

// Filter logs
val filteredLogs = logViewMachine.getLogs(LogFilter(
    level = "INFO",
    tags = listOf("cooking"),
    limit = 10
))

// Subscribe to real-time updates
val unsubscribe = logViewMachine.subscribe { logs ->
    println("New logs: ${logs.size}")
}
```

### GraphQL Queries

```kotlin
val resolver = StateMachineResolver()
resolver.registerStateMachine(stateMachine)
val graphQLServer = GraphQLServer(resolver)

// Query state machine
val query = """
    query {
        stateMachine(name: "tastyfishburger") {
            name
            currentState {
                from { name }
                to { name }
            }
            processing
            log {
                message { id data }
                resolution { success message }
            }
        }
    }
"""

val result = graphQLServer.executeQuery(query)
```

## State Flow

1. **Idle** - Machine is ready for new orders
2. **Processing** - Cooking fish burger
3. **Completed** - Fish burger is ready
4. **Error** - Error occurred during cooking

## Log Levels

- **DEBUG** - Detailed debugging information
- **INFO** - General information
- **WARN** - Warning messages
- **ERROR** - Error messages

## Message Types

- **Start Cooking** - Begin cooking process
- **Progress Update** - Update cooking progress
- **Complete Cooking** - Finish cooking process
- **Error** - Handle cooking errors

## Testing

Run the test to verify the implementation:

```bash
kotlin FishBurgerTest.kt
```

## Integration

The backend integrates with:

- **GraphQL Server** - For querying state machines
- **Log View Machine** - For log management
- **View State Machine** - For fluent API
- **Base State Machine** - For core state machine functionality

This provides a complete backend solution for the fish burger system with proper state management, logging, and communication capabilities. 
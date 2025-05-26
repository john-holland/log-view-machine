#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start both Java and Kotlin servers"
    echo "  stop        Stop all running servers"
    echo "  restart     Restart all servers"
    echo "  logs        Show logs from all servers"
    echo "  build       Build both servers"
    echo "  test        Run tests for both servers"
    echo "  clean       Clean build artifacts"
    echo "  help        Show this help message"
}

# Function to start servers
start_servers() {
    echo "Starting servers..."
    docker-compose up -d
}

# Function to stop servers
stop_servers() {
    echo "Stopping servers..."
    docker-compose down
}

# Function to show logs
show_logs() {
    docker-compose logs -f
}

# Function to build servers
build_servers() {
    echo "Building Java server..."
    cd src/server/java && mvn clean package && cd ../../..
    
    echo "Building Kotlin server..."
    cd src/server/kotlin && ./gradlew build && cd ../../..
}

# Function to run tests
run_tests() {
    echo "Running Java server tests..."
    cd src/server/java && mvn test && cd ../../..
    
    echo "Running Kotlin server tests..."
    cd src/server/kotlin && ./gradlew test && cd ../../..
}

# Function to clean build artifacts
clean_build() {
    echo "Cleaning Java server build..."
    cd src/server/java && mvn clean && cd ../../..
    
    echo "Cleaning Kotlin server build..."
    cd src/server/kotlin && ./gradlew clean && cd ../../..
}

# Main script logic
case "$1" in
    start)
        start_servers
        ;;
    stop)
        stop_servers
        ;;
    restart)
        stop_servers
        start_servers
        ;;
    logs)
        show_logs
        ;;
    build)
        build_servers
        ;;
    test)
        run_tests
        ;;
    clean)
        clean_build
        ;;
    help|*)
        show_help
        ;;
esac 
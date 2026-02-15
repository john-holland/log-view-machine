#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "Redis is ready!"

# Wait for Unleash to be ready
echo "Waiting for Unleash to be ready..."
while ! nc -z unleash 4242; do
  sleep 1
done
echo "Unleash is ready!"

# Run database migrations
echo "Running database migrations..."
npm run migrate

# Initialize Unleash
echo "Initializing Unleash..."
npm run init-unleash

echo "Setup complete! 🎉" 
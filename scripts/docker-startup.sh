#!/bin/bash

# Docker startup script for Hydra Game
echo "🐳 Starting Hydra Game in Docker..."

# Set environment variables
export DOCKER=true
export NODE_ENV=${NODE_ENV:-development}

echo "🔧 Environment: Docker | $NODE_ENV"
echo "📊 Database URL: ${DATABASE_URL/\/\/.*@/\/\/***:***@}"

# Wait for database to be ready with timeout
echo "⏳ Waiting for database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.connect()
            .then(client => {
                client.release();
                pool.end();
                console.log('✅ Database ready!');
                process.exit(0);
            })
            .catch(() => process.exit(1));
    " >/dev/null 2>&1; then
        break
    fi
    
    echo "🔄 Database not ready, waiting... ($attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Database failed to become ready after $max_attempts attempts"
    exit 1
fi

# Run database migrations
echo "🚀 Running database migrations..."
pnpm db:push || {
    echo "❌ Database migration failed"
    exit 1
}

echo "✅ Database setup completed!"

# Start the development server
echo "🚀 Starting development server..."
exec pnpm dev
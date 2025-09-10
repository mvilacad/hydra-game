#!/bin/bash

# Setup script for Hydra Game database
echo "🎮 Setting up Hydra Game database..."

# Detect environment
if [ -f /.dockerenv ] || [ "$DOCKER" = "true" ]; then
    ENVIRONMENT="docker"
    echo "🐳 Running in Docker environment"
else
    ENVIRONMENT="local"
    echo "💻 Running in local environment"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    if [ "$ENVIRONMENT" = "docker" ]; then
        echo "⚠️  DATABASE_URL environment variable not set for Docker"
        echo "Setting default to postgresql://postgres:postgres@db:5432/hydra_game"
        export DATABASE_URL="postgresql://postgres:postgres@db:5432/hydra_game"
    else
        echo "⚠️  DATABASE_URL environment variable not set for local"
        echo "Setting default to postgresql://localhost:5432/hydra_game"
        export DATABASE_URL="postgresql://localhost:5432/hydra_game"
    fi
fi

echo "📊 Database URL: ${DATABASE_URL/\/\/.*@/\/\/***:***@}"

# Install dependencies if needed
echo "📦 Checking dependencies..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm first."
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Wait for database to be ready (in Docker environment)
if [ "$ENVIRONMENT" = "docker" ]; then
    echo "⏳ Waiting for database to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
            echo "✅ Database is ready!"
            break
        fi
        
        echo "🔄 Attempt $attempt/$max_attempts: Database not ready, waiting 2s..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo "❌ Database failed to become ready after $max_attempts attempts"
        echo "💡 Make sure the database service is healthy"
        exit 1
    fi
fi

# Test database connection using Node.js
echo "🔍 Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as connected_at');
    client.release();
    console.log('✅ Database connection successful at:', result.rows[0].connected_at);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
" || {
    echo "❌ Database connection test failed"
    echo "💡 Check your DATABASE_URL and ensure the database is running"
    exit 1
}

# Generate migration files
echo "🔄 Generating database schema..."
pnpm db:generate || {
    echo "⚠️  Schema generation failed, but continuing..."
}

# Push schema to database
echo "🚀 Pushing database schema..."
pnpm db:push || {
    echo "❌ Database schema push failed"
    exit 1
}

echo "✅ Database setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Set your DATABASE_URL environment variable"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Open http://localhost:5000 to access the game"
echo ""
echo "🔗 API endpoints:"
echo "• Health: http://localhost:5000/api/health"  
echo "• Games: http://localhost:5000/api/games"
echo "• Questions: http://localhost:5000/api/questions"
echo ""
echo "🎮 Happy gaming!"
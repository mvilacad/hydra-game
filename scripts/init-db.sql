-- Hydra Game Database Initialization
-- This script runs when the PostgreSQL container starts for the first time

-- Ensure the database exists
CREATE DATABASE hydra_game;

-- Connect to the database
\c hydra_game;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up basic configuration
SET timezone = 'UTC';

-- Log database initialization
DO $$
BEGIN
    RAISE NOTICE '🎮 Hydra Game database initialized successfully';
    RAISE NOTICE '📊 Database: %', current_database();
    RAISE NOTICE '🕒 Timestamp: %', now();
END $$;
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";

// Environment detection
const isDocker = process.env.DATABASE_URL?.includes("@db:");

// Database configuration
const connectionString =
	process.env.DATABASE_URL || "postgresql://localhost:5432/hydra_game";

console.log(`🔧 Environment: ${isDocker ? "Docker" : "Local"} | ${process.env.NODE_ENV || "development"}`);
console.log(`📊 Database URL: ${connectionString.replace(/\/\/.*@/, "//***:***@")}`);

// Create connection pool with retry logic
const pool = new Pool({
	connectionString,
	// Connection pool settings
	max: isDocker ? 10 : 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: isDocker ? 5000 : 2000,
	// Retry settings
	query_timeout: 10000,
	statement_timeout: 15000,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Enhanced connection retry logic
export async function connectWithRetry(
	maxRetries = 10, 
	retryDelay = 2000
): Promise<boolean> {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
			
			const client: PoolClient = await pool.connect();
			await client.query("SELECT NOW() as connected_at, version() as pg_version");
			client.release();
			
			console.log("✅ Database connection successful!");
			
			// Test Drizzle integration
			try {
				// Simple query to test Drizzle setup
				await db.execute("SELECT 1 as test");
				console.log("✅ Drizzle ORM integration working!");
			} catch (drizzleError) {
				console.warn("⚠️  Drizzle test failed:", drizzleError);
			}
			
			return true;
		} catch (error: unknown) {
			const isLastAttempt = attempt === maxRetries;
			const errorMessage = (error as Error)?.message || "Unknown error";
			
			if (isLastAttempt) {
				console.error(`❌ Database connection failed after ${maxRetries} attempts:`, errorMessage);
				
				// Provide helpful error messages
				if (errorMessage.includes("ECONNREFUSED")) {
					console.error("💡 Suggestion: Make sure PostgreSQL is running and accessible");
					if (isDocker) {
						console.error("   - Check if 'db' service is healthy in Docker Compose");
					} else {
						console.error("   - Check if PostgreSQL is running on localhost:5432");
					}
				} else if (errorMessage.includes("authentication failed")) {
					console.error("💡 Suggestion: Check your database credentials");
				} else if (errorMessage.includes("does not exist")) {
					console.error("💡 Suggestion: Create the 'hydra_game' database first");
				}
				
				return false;
			}
			
			console.warn(`⚠️  Attempt ${attempt} failed: ${errorMessage}`);
			console.log(`⏳ Retrying in ${retryDelay}ms...`);
			
			await new Promise(resolve => setTimeout(resolve, retryDelay));
			
			// Exponential backoff with jitter
			retryDelay = Math.min(retryDelay * 1.2 + Math.random() * 1000, 10000);
		}
	}
	
	return false;
}

// Test database connection (legacy function - use connectWithRetry instead)
export async function testConnection(): Promise<boolean> {
	console.log("⚠️  testConnection() is deprecated, use connectWithRetry() instead");
	return connectWithRetry(3, 1000);
}

// Health check endpoint
export async function healthCheck(): Promise<{
	status: string;
	database: boolean;
	timestamp: string;
	details?: Record<string, unknown>;
}> {
	const timestamp = new Date().toISOString();
	
	try {
		const client = await pool.connect();
		const result = await client.query(`
			SELECT 
				NOW() as server_time,
				version() as version,
				current_database() as database_name,
				current_user as user_name
		`);
		client.release();
		
		return {
			status: "healthy",
			database: true,
			timestamp,
			details: result.rows[0]
		};
	} catch (error) {
		return {
			status: "unhealthy", 
			database: false,
			timestamp,
			details: { error: (error as Error).message }
		};
	}
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
	await pool.end();
	console.log("🔌 Database connection closed");
}

// Handle process termination
process.on("SIGINT", async () => {
	await closeConnection();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await closeConnection();
	process.exit(0);
});

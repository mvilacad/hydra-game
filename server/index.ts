import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { registerRoutes } from "./routes";

function log(message: string, source = "express") {
	const formattedTime = new Date().toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});

	console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
	const start = Date.now();
	const path = req.path;
	let capturedJsonResponse: Record<string, any> | undefined;

	const originalResJson = res.json;
	res.json = (bodyJson, ...args) => {
		capturedJsonResponse = bodyJson;
		return originalResJson.apply(res, [bodyJson, ...args]);
	};

	res.on("finish", () => {
		const duration = Date.now() - start;
		if (path.startsWith("/api")) {
			let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
			if (capturedJsonResponse) {
				logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
			}

			if (logLine.length > 80) {
				logLine = logLine.slice(0, 79) + "…";
			}

			log(logLine);
		}
	});

	next();
});

(async () => {
	const server = await registerRoutes(app);

	app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
		const status = err.status || err.statusCode || 500;
		const message = err.message || "Internal Server Error";

		res.status(status).json({ message });
		throw err;
	});

	// importantly only setup vite in development and after
	// setting up all the other routes so the catch-all route
	// doesn't interfere with the other routes
	if (app.get("env") === "development") {
		const { setupVite } = await import("./vite.js");
		await setupVite(app, server);
	} else {
		// Serve static files in production without importing Vite dependencies
		const { serveStatic } = await import("./static.js");
		serveStatic(app);
	}

	// ALWAYS serve the app on port 5000
	// this serves both the API and the client
	const port = 5000;
	server.listen(
		{
			port,
			host: "0.0.0.0",
			reusePort: true,
		},
		() => {
			log(`serving on port ${port}`);
		},
	);
})();

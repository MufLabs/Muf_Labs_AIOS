import express, {
    type Express,
    type Request,
    type Response,
    type NextFunction
} from "express";
import cors from "cors";

import { registerRoutes } from "./routes/index";
import { bootstrapLogger, newRequestId } from "./services/bootstrapLogger";

/**
 * Creates and configures the Express application.
 * Reads CORS origins from environment variable CORS_ORIGIN (comma-separated).
 */
export function createServer(): Express {

    const app = express();

    // Parse JSON bodies
    app.use(express.json());

    // CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost,http://localhost:5173";
    const allowedOrigins = corsOrigin.split(",").map((o) => o.trim());
    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-TBit-API-Key"]
    }));

    // Health check endpoint (no auth required)
    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Register API routes
    registerRoutes(app);

    // Global error handler
    app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
        const requestId = newRequestId();
        const endpoint = `${req.method} ${req.originalUrl ?? req.url}`;
        bootstrapLogger.error("GlobalErrorHandler", "Unhandled API error.", err, {
            requestId,
            endpoint,
            metadata: { method: req.method, url: req.originalUrl ?? req.url },
        });
        res.status(500).json({
            error: "Internal server error",
            message: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    });

    return app;

}

export function startServer(app: Express): void {
    const port = parseInt(process.env.PORT ?? "3000", 10);
    const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost,http://localhost:5173";
    app.listen(port, "0.0.0.0", () => {
        console.log(`[AIOS API] Server listening on port ${port}`);
        console.log(`[AIOS API] CORS enabled for: ${corsOrigin}`);
    });
}

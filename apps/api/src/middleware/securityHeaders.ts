import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware using Helmet.
 * Provides production-grade HTTP security headers.
 * Configured for API use with CSP tuned for potential Three.js/WebGL assets.
 */
export function securityHeaders(): ReturnType<typeof helmet> {
  return helmet({
    // Content Security Policy - allow same-origin + inline styles/scripts for Three.js/Vite
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Vite/Three.js may need inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Vite/Three.js may need inline styles
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // HTTP Strict Transport Security - enable in production
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // Prevent clickjacking
    frameguard: { action: "deny" },
    // XSS protection (legacy but harmless)
    xssFilter: true,
    // Referrer policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Cross-Origin Embedder Policy - require CORP or COEP
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: "same-origin" },
    // Disable DNS prefetch
    dnsPrefetchControl: { allow: false },
    // Disable client-side caching of sensitive data
    hidePoweredBy: true,
    // IE no open
    ieNoOpen: true,
  });
}

/**
 * Middleware to add security headers to all responses.
 * Exports a named function for easier testing.
 */
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  securityHeaders()(req, res, next);
}
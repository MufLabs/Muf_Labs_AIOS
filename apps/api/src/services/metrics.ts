import { Request, Response } from "express";

/**
 * Lightweight Prometheus-style metrics endpoint.
 * In-memory counters only (no persistence).
 * Zero dependencies (stdlib only).
 *
 * Metrics exposed:
 * - http_requests_total{method,path,status}
 * - http_request_duration_seconds_bucket{method,path,le}
 * - http_request_duration_seconds_sum{method,path}
 * - http_request_duration_seconds_count{method,path}
 * - vault_bootstrap_total{status}
 */

interface Counter {
  value: number;
  labels: Record<string, string>;
}

interface Histogram {
  sum: number;
  count: number;
  buckets: Record<string, number>;
  labels: Record<string, string>;
}

class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private readonly bucketBounds = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

  private makeKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  /**
   * Increment a counter.
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.makeKey(name, labels);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { value, labels: { ...labels } });
    }
  }

  /**
   * Observe a histogram value (in seconds).
   */
  observeHistogram(name: string, valueSeconds: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    let existing = this.histograms.get(key);
    if (!existing) {
      existing = {
        sum: 0,
        count: 0,
        buckets: {},
        labels: { ...labels },
      };
      // Initialize buckets
      for (const bound of this.bucketBounds) {
        existing.buckets[bound.toString()] = 0;
      }
      existing.buckets["+Inf"] = 0;
      this.histograms.set(key, existing);
    }
    existing.sum += valueSeconds;
    existing.count += 1;
    for (const bound of this.bucketBounds) {
      if (valueSeconds <= bound) {
        existing.buckets[bound.toString()] += 1;
      }
    }
    existing.buckets["+Inf"] += 1;
  }

  /**
   * Get all metrics in Prometheus text format.
   */
  getMetrics(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, counter] of this.counters) {
      lines.push(`# TYPE ${key.split("{")[0]} counter`);
      lines.push(`${key} ${counter.value}`);
    }

    // Histograms
    for (const [key, histogram] of this.histograms) {
      const baseName = key.split("{")[0];
      lines.push(`# TYPE ${baseName} histogram`);
      for (const [bound, count] of Object.entries(histogram.buckets)) {
        const le = bound === "+Inf" ? "+Inf" : bound;
        const labelStr = Object.entries(histogram.labels)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}="${v}"`)
          .join(",");
        const bucketKey = `${baseName}_bucket{${labelStr},le="${le}"}`;
        lines.push(`${bucketKey} ${count}`);
      }
      const labelStr = Object.entries(histogram.labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");
      lines.push(`${baseName}_sum{${labelStr}} ${histogram.sum}`);
      lines.push(`${baseName}_count{${labelStr}} ${histogram.count}`);
    }

    return lines.join("\n") + "\n";
  }

  /**
   * Reset all metrics (for testing).
   */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

/**
 * Record an HTTP request for metrics.
 */
export function recordHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): void {
  const labels = {
    method,
    path: normalizePath(path),
    status: statusCode.toString(),
  };
  metricsCollector.incrementCounter("http_requests_total", labels);
  metricsCollector.observeHistogram("http_request_duration_seconds", durationMs / 1000, labels);
}

/**
 * Record a vault bootstrap event for metrics.
 */
export function recordVaultBootstrap(status: "success" | "failure"): void {
  metricsCollector.incrementCounter("vault_bootstrap_total", { status });
}

/**
 * Normalize path for metrics (replace dynamic segments with placeholders).
 * e.g., /api/v1/tbit/vault/init -> /api/v1/tbit/vault/init
 *       /api/v1/tbit/memory/abc123 -> /api/v1/tbit/memory/:id
 */
function normalizePath(path: string): string {
  // Replace UUIDs
  let normalized = path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "/:id"
  );
  // Replace other common ID patterns
  normalized = normalized.replace(/\/[a-zA-Z0-9_-]{20,}/g, "/:id");
  return normalized;
}

/**
 * Express handler for /metrics endpoint.
 */
export function metricsHandler(_req: Request, res: Response): void {
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(metricsCollector.getMetrics());
}

/**
 * Enable/disable metrics collection (can be toggled via env).
 */
export let metricsEnabled = process.env.ENABLE_METRICS === "true";

export function setMetricsEnabled(enabled: boolean): void {
  metricsEnabled = enabled;
}
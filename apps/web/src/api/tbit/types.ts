export interface ContainerHealth {
  containerId: string;
  spaceId: string;
  label: string;
  status: "healthy" | "degraded" | "unhealthy" | "starting";
  offsets: { header: number; index: number; data: number };
  createdAt: string;
  updatedAt: string;
  memoryUsage: {
    used: number;
    available: number;
    percent: number;
  };
  indexStats: {
    totalEntries: number;
    totalSize: number;
  };
}
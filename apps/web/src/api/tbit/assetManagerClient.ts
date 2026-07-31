import { ContainerHealth } from "./types";

const API_BASE = "/api/tbit";

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export async function fetchContainerHealth(): Promise<ContainerHealth> {
  const response = await fetch(`${API_BASE}/containers/health`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function fetchContainerMetrics(containerId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/containers/${containerId}/metrics`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function fetchContainerLogs(containerId: string, lines = 100): Promise<string[]> {
  const response = await fetch(`${API_BASE}/containers/${containerId}/logs?lines=${lines}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export interface BinaryAsset {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  checksum: string;
  encryptionKeyId: string | null;
  compression: "none" | "gzip" | "zstd" | "lz4";
  chunks: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchBinaryAssets(): Promise<BinaryAsset[]> {
  const response = await fetch(`${API_BASE}/assets?type=binary`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function uploadBinaryAsset(
  file: File,
  options: { compression: BinaryAsset["compression"]; encryptionKeyId: string | null; tags: string[] }
): Promise<BinaryAsset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("compression", options.compression);
  if (options.encryptionKeyId) formData.append("encryptionKeyId", options.encryptionKeyId);
  if (options.tags.length) formData.append("tags", JSON.stringify(options.tags));

  const response = await fetch(`${API_BASE}/assets/import/binary`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  return response.json();
}

export async function deleteBinaryAsset(key: string): Promise<void> {
  const response = await fetch(`${API_BASE}/assets/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

export async function downloadBinaryAsset(key: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/assets/${encodeURIComponent(key)}/download`);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  return response.blob();
}

export interface MarkdownDocument {
  key: string;
  title: string;
  content: string;
  contentPreview: string;
  wordCount: number;
  charCount: number;
  tags: string[];
  source: string;
  checksum: string;
  status: "indexed" | "pending" | "failed" | "processing";
  chunks: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchMarkdownDocuments(): Promise<MarkdownDocument[]> {
  const response = await fetch(`${API_BASE}/markdown`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export interface ImportMarkdownOptions {
  source: string;
  tags: string[];
  splitChunks: boolean;
  maxChunkSize: number;
}

export async function importMarkdownDocuments(
  files: File[],
  options: ImportMarkdownOptions
): Promise<MarkdownDocument[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("source", options.source);
  formData.append("tags", JSON.stringify(options.tags));
  formData.append("splitChunks", String(options.splitChunks));
  formData.append("maxChunkSize", String(options.maxChunkSize));

  const response = await fetch(`${API_BASE}/markdown/import`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Import failed: ${response.status}`);
  }
  return response.json();
}

export async function reindexMarkdownDocument(key: string): Promise<void> {
  const response = await fetch(`${API_BASE}/markdown/${encodeURIComponent(key)}/reindex`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Reindex failed: ${response.status}`);
  }
}

export async function deleteMarkdownDocument(key: string): Promise<void> {
  const response = await fetch(`${API_BASE}/markdown/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

export async function updateMarkdownDocumentStatus(
  key: string,
  status: "indexed" | "pending"
): Promise<void> {
  const response = await fetch(`${API_BASE}/markdown/${encodeURIComponent(key)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(`Status update failed: ${response.status}`);
  }
}
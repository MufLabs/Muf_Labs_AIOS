/**
 * API test client for integration testing
 * Provides typed HTTP client for testing API endpoints
 */

import { fetch, RequestInit, Headers } from 'undici';

export interface ApiTestClientConfig {
  baseUrl: string;
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: ApiResponse['meta'] & {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Typed API test client for AIOS REST API
 */
export class ApiTestClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiTestClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  /**
   * Set or update API key
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Get headers with auth
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }
    return headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: this.getHeaders(customHeaders),
    };

    if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    const data = await response.json();

    return {
      success: response.ok && data.success !== false,
      data: response.ok ? data.data ?? data : undefined,
      error: !response.ok || data.success === false
        ? {
            code: data.error?.code || `HTTP_${response.status}`,
            message: data.error?.message || response.statusText,
            details: data.error?.details,
          }
        : undefined,
      meta: data.meta,
    };
  }

  // ==================== HTTP Methods ====================

  async get<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, headers);
  }

  async post<T>(path: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, headers);
  }

  async put<T>(path: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, headers);
  }

  async patch<T>(path: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, headers);
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, headers);
  }

  // ==================== Health ====================

  async health(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.get('/health');
  }

  // ==================== Memory Core ====================

  async remember(key: string, payload: any, context?: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/remember', { key, payload, context });
  }

  async rememberBatch(items: Array<{ key: string; payload: any; context?: string }>): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/remember-batch', { items });
  }

  async recall(key: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/recall', { key });
  }

  async getContext(query: string, limit = 10): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/context', { query, limit });
  }

  async getMemoryGraph(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/memory/graph');
  }

  async getMemoryLinks(key: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/links', { key });
  }

  async deleteMemory(key: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/delete', { key });
  }

  async deleteMemoryBatch(keys: string[]): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/memory/delete-batch', { keys });
  }

  // ==================== Query Index ====================

  async getQueryStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/query/stats');
  }

  async rebuildQueryIndex(): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/query/rebuild');
  }

  async syncQueryIndex(): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/query/sync');
  }

  async searchQueryIndex(query: string, limit = 10): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/query/search', { query, limit });
  }

  async getQueryIndex(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/query');
  }

  // ==================== Semantic Index ====================

  async getSemanticStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/semantic/stats');
  }

  async rebuildSemanticIndex(): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/semantic/rebuild');
  }

  async searchSemanticIndex(query: string, limit = 10): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/semantic/search', { query, limit });
  }

  // ==================== Network / Anti-Entropy ====================

  async getNetworkState(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/network/state');
  }

  async exportNetworkRecord(): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/network/export-record');
  }

  async importNetworkRecord(record: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/network/import-record', { record });
  }

  async compareNetworkState(otherState: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/network/compare', { otherState });
  }

  // ==================== Setup / Bootstrap ====================

  async getSetupStatus(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/setup/status');
  }

  async bootstrap(vaultRoot: string, options?: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/setup/bootstrap', { vaultRoot, ...options });
  }

  // ==================== Assets ====================

  async listAssets(filter?: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/assets/list', filter || {});
  }

  async getAssetStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/assets/stats');
  }

  async registerAsset(asset: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/assets/register', asset);
  }

  async deleteAsset(assetId: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/assets/delete', { assetId });
  }

  // ==================== Encryption ====================

  async getEncryptionStatus(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/encryption/status');
  }

  async generateKey(): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/encryption/generate');
  }

  async activateKey(keyId: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/encryption/activate', { keyId });
  }

  async getKeyRing(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/encryption/keys');
  }

  // ==================== Permissions ====================

  async getPermissionsPolicy(agentId?: string): Promise<ApiResponse<any>> {
    const path = agentId ? `/api/v1/tbit/permissions/policy/${agentId}` : '/api/v1/tbit/permissions/policy';
    return this.get(path);
  }

  async updatePermissionsPolicy(agentId: string, policy: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/permissions/policy', { agentId, policy });
  }

  // ==================== Markdown Bridge ====================

  async importMarkdown(request: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/markdown/import', request);
  }

  async listMarkdownDocuments(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/markdown/documents');
  }

  async deleteMarkdownDocument(docId: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/markdown/delete', { docId });
  }

  // ==================== Binary Assets ====================

  async importBinaryAsset(request: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/binary/import', request);
  }

  async reconstructBinaryAsset(assetId: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/binary/reconstruct', { assetId });
  }

  async deleteBinaryAsset(assetId: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/binary/delete', { assetId });
  }

  // ==================== Universal Document ====================

  async importUniversalDocument(request: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/document/import', request);
  }

  async answerDocumentQuestion(docId: string, question: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/document/qa', { docId, question });
  }

  // ==================== KV Store ====================

  async getKv(key: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/kv/get', { key });
  }

  async setKv(key: string, value: any, options?: any): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/kv/set', { key, value, ...options });
  }

  async deleteKv(key: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/kv/delete', { key });
  }

  async listKvKeys(prefix?: string): Promise<ApiResponse<any>> {
    return this.post('/api/v1/tbit/kv/list', { prefix });
  }

  async getKvStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/tbit/kv/stats');
  }

  // ==================== Test Helpers ====================

  /**
   * Assert response is successful
   */
  expectSuccess<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(`API call failed: ${response.error?.message} (${response.error?.code})`);
    }
    return response.data as T;
  }

  /**
   * Assert response has specific error
   */
  expectError(response: ApiResponse<any>, code?: string): ApiResponse<any> {
    if (response.success) {
      throw new Error('Expected error response but got success');
    }
    if (code && response.error?.code !== code) {
      throw new Error(`Expected error code ${code} but got ${response.error?.code}`);
    }
    return response;
  }

  /**
   * Create client for different environments
   */
  static forLocal(): ApiTestClient {
    return new ApiTestClient({ baseUrl: 'http://localhost:3001' });
  }

  static forDocker(): ApiTestClient {
    return new ApiTestClient({ baseUrl: 'http://api:3001' });
  }

  static forStaging(): ApiTestClient {
    return new ApiTestClient({
      baseUrl: process.env.STAGING_API_URL || 'https://staging-api.aios.example.com',
      apiKey: process.env.STAGING_API_KEY,
    });
  }

  static forProduction(): ApiTestClient {
    return new ApiTestClient({
      baseUrl: process.env.PROD_API_URL || 'https://api.aios.example.com',
      apiKey: process.env.PROD_API_KEY,
    });
  }
}

/**
 * Creates an authenticated test client with a valid API key
 */
export async function createAuthenticatedClient(baseUrl: string = 'http://localhost:3001'): Promise<ApiTestClient> {
  const client = new ApiTestClient({ baseUrl });

  // In real tests, this would bootstrap or use a test API key
  // For now, we'll use a default test key
  client.setApiKey('test-api-key-12345');

  return client;
}
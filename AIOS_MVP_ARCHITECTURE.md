# AIOS MVP Architecture Document

## T-BIT AIOS MVP - Architecture Overview

**Version**: 1.0.0  
**Date**: 2025  
**Status**: Draft  
**Based on**: AIOS_Book.md (AIOS Knowledge Bible)

---

## 1. Executive Summary

The **T-BIT AIOS (Artificial Intelligence Operating System) MVP** is a modular, extensible operating system for AI agents built on the **T-BIT (Temporal Bit)** architecture. It provides a unified substrate for memory, reasoning, agents, workflows, and distributed synchronization across multiple nodes.

### Core Philosophy
- **T-BIT as Universal Primitive**: Every piece of knowledge, memory, document, or computation is a T-BIT (Temporal Bit) - a cryptographically signed, versioned, time-stamped unit of information
- **Symbolic-Neuronal Fusion**: Symbolic reasoning (T-BITs, logic, graphs) fused with neural capabilities (embeddings, LLMs, semantic search)
- **Local-First, Network-Ready**: Local-first architecture with built-in P2P synchronization (anti-entropy, CRDTs, gossip)
- **Agent-Native**: Agents are first-class citizens with permissions, memory, tools, and workflows
- **Local-First AI**: LLM providers are pluggable (Ollama, OpenAI, Anthropic, etc.) with local-first priority

---

## 2. System Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATIONS LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Web App   │  │ Desktop App │  │  CLI Tool   │  │  Custom Apps     │   │
│  │  (Next.js)  │  │ (Electron)  │  │  (Node.js)  │  │  (SDK)           │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘   │
└─────────┼────────────────┼────────────────┼──────────────────┼─────────────┘
          │                │                │                  │
          ▼                ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway (Fastify/Express)                      │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐   │   │
│  │  │ Auth    │ │ Rate     │ │ Request  │ │ Error   │ │ OpenAPI    │   │   │
│  │  │ Middle  │ │ Limit    │ │ Validation│ │ Handling│ │ Docs       │   │   │
│  │  └─────────┘ └──────────┘ └──────────┘ └─────────┘ └────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER (Domain Services)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ T-BIT Core   │ │ Memory Core  │ │ Network      │ │ Semantic Index   │   │
│  │ Service      │ │ Service      │ │ Sync Service │ │ Service          │   │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ Query Index  │ │ Guardian     │ │ Asset        │ │ Document         │   │
│  │ Service      │ │ Observer     │ │ Service      │ │ Service          │   │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ Agent        │ │ Workflow     │ │ LLM          │ │ Permission       │   │
│  │ Runtime      │ │ Engine       │ │ Gateway      │ │ Service          │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KERNEL LAYER (Core Primitives)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ T-BIT        │ │ Crypto       │ │ Storage      │ │ Event Bus        │   │
│  │ Primitive    │ │ Primitives   │ │ Abstraction  │ │ (Event Sourcing) │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ Identity &   │ │ WAL /        │ │ Merkle       │ │ Network          │   │
│  │ Permissions  │ │ Recovery     │ │ DAG / CRDT   │ │ Primitives       │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ SQLite /     │ │ Vector DB    │ │ Object       │ │ P2P Network      │   │
│  │ SQLite-vec   │ │ (sqlite-vec, │ │ Storage      │ │ (libp2p,        │   │
│  │ / LibSQL     │ │  pgvector)   │ │ (S3, FS,     │ │  WebRTC)         │   │
│  │              │ │              │ │  IPFS)       │ │                  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ LLM Providers│ │ Embedding    │ │ File System  │ │ OS Integration   │   │
│  │ (Ollama,     │ │ Providers    │ │ Watchers     │ │ (FS Watcher,     │   │
│  │  OpenAI,     │ │              │ │              │ │  Notifications)  │   │
│  │  Anthropic)  │ │              │ │              │ │                  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Package Architecture (Monorepo Structure)

```
muf-labs/
├── packages/
│   ├── kernel/              # @aios/kernel - Core primitives, types, crypto
│   │   ├── src/
│   │   │   ├── tbit.ts          # T-BIT primitive definition
│   │   │   ├── crypto.ts        # Crypto primitives (HMAC, signing, Merkle)
│   │   │   ├── identity.ts      # Identity, keys, permissions
│   │   │   ├── storage.ts       # Storage abstraction (KV, WAL, Merkle)
│   │   │   ├── events.ts        # Event bus, event sourcing
│   │   │   ├── network.ts       # Network primitives (gossip, CRDT)
│   │   │   ├── types.ts         # Core type definitions
│   │   │   └── index.ts         # Public exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── tbit-core/           # @aios/tbit-core - Core T-BIT logic
│   │   ├── src/
│   │   │   ├── tbit-store.ts       # T-BIT storage operations
│   │   │   ├── tbit-index.ts       # T-BIT indexing (by key, tag, time)
│   │   │   ├── merkle-dag.ts       # Merkle DAG operations
│   │   │   ├── crdt.ts             # CRDT implementations (LWW, OR-Set)
│   │   │   ├── anti-entropy.ts     # Anti-entropy / gossip sync
│   │   │   ├── network-sync.ts     # Network synchronization
│   │   │   ├── recovery.ts         # WAL recovery
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── memory/              # @aios/memory - Memory Core subsystem
│   │   ├── src/
│   │   │   ├── memory-core.ts      # Memory Core (remember, recall, context)
│   │   │   ├── memory-graph.ts     # Memory graph (links, associations)
│   │   │   ├── context-builder.ts  # Context assembly for LLMs
│   │   │   ├── memory-index.ts     # Query index for memory
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── semantic/            # @aios/semantic - Semantic Index
│   │   ├── src/
│   │   │   ├── semantic-index.ts   # Vector index (sqlite-vec, HNSW)
│   │   │   ├── embeddings.ts       # Embedding provider abstraction
│   │   │   ├── search.ts           # Semantic search (hybrid: vector + keyword)
│   │   │   ├── rebuild.ts          # Index rebuild utilities
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── query/               # @aios/query - Query Index
│   │   ├── src/
│   │   │   ├── query-index.ts      # Inverted index (token, tag, attr)
│   │   │   ├── tokenizer.ts        # Tokenization strategies
│   │   │   ├── search.ts           # Query execution
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── guardian/            # @aios/guardian - Guardian Observer
│   │   ├── src/
│   │   │   ├── observer.ts         # Guardian Observer (consistency, drift)
│   │   │   ├── policies.ts         # Guardian policies
│   │   │   ├── reconciliation.ts   # Reconciliation engine
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── assets/              # @aios/assets - Asset Management
│   │   ├── src/
│   │   │   ├── asset-store.ts      # Asset storage (binary, metadata)
│   │   │   ├── binary-asset.ts     # Binary asset handling
│   │   │   ├── markdown.ts         # Markdown document handling
│   │   │   ├── document-importer.ts # Universal document import
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── llm/                 # @aios/llm - LLM Gateway
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── base.ts           # Base provider interface
│   │   │   │   ├── ollama.ts         # Ollama provider
│   │   │   │   ├── openai.ts         # OpenAI provider
│   │   │   │   ├── anthropic.ts      # Anthropic provider
│   │   │   │   └── index.ts
│   │   │   ├── gateway.ts            # LLM Gateway (routing, fallback, cache)
│   │   │   ├── chat.ts               # Chat completion abstraction
│   │   │   ├── embeddings.ts         # Embedding abstraction
│   │   │   ├── tools.ts              # Tool calling abstraction
│   │   │   ├── streaming.ts          # Streaming support
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agents/              # @aios/agents - Agent Framework
│   │   ├── src/
│   │   │   ├── agent.ts            # Base Agent class
│   │   │   ├── runtime.ts          # Agent Runtime (lifecycle, scheduling)
│   │   │   ├── memory.ts           # Agent memory integration
│   │   │   ├── tools.ts            # Tool registry and execution
│   │   │   ├── permissions.ts      # Agent permissions
│   │   │   ├── communication.ts    # Agent-to-agent communication
│   │   │   ├── templates.ts        # Agent templates/archetypes
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── workflow/            # @aios/workflow - Workflow Engine
│   │   ├── src/
│   │   │   ├── engine.ts           # Workflow execution engine
│   │   │   ├── dsl.ts              # Workflow DSL (YAML/JSON)
│   │   │   ├── nodes.ts            # Node types (LLM, Tool, Branch, Loop)
│   │   │   ├── state.ts            # Workflow state management
│   │   │   ├── persistence.ts      # Workflow persistence
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/            # @aios/database - Database Abstraction
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   ├── sqlite.ts         # SQLite adapter (better-sqlite3)
│   │   │   │   ├── libsql.ts         # LibSQL/Turso adapter
│   │   │   │   ├── postgres.ts       # PostgreSQL adapter
│   │   │   │   └── index.ts
│   │   │   ├── connection.ts         # Connection pool management
│   │   │   ├── migrations.ts         # Migration system
│   │   │   ├── repository.ts         # Repository pattern
│   │   │   ├── query-builder.ts      # Type-safe query builder
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── network/             # @aios/network - P2P Network Layer
│   │   ├── src/
│   │   │   ├── libp2p.ts           # libp2p integration
│   │   │   ├── gossipsub.ts        # GossipSub pubsub
│   │   │   ├── kad-dht.ts          # Kademlia DHT
│   │   │   ├── webrtc.ts           # WebRTC transport
│   │   │   ├── sync-protocol.ts    # Sync protocol (anti-entropy)
│   │   │   ├── peer-discovery.ts   # Peer discovery (mDNS, bootstrap)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                  # @aios/ui - Shared UI Components
│   │   ├── src/
│   │   │   ├── components/         # React components
│   │   │   ├── hooks/              # React hooks
│   │   │   ├── theme/              # Theme system
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdk/                 # @aios/sdk - Client SDK
│   │   ├── src/
│   │   │   ├── client.ts           # API Client (REST + WebSocket)
│   │   │   ├── types.ts            # TypeScript types
│   │   │   ├── auth.ts             # Authentication helpers
│   │   │   ├── realtime.ts         # Real-time subscriptions
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/              # @aios/shared - Shared utilities
│       ├── src/
│       │   ├── logger.ts           # Structured logging
│       │   ├── config.ts           # Configuration management
│       │   ├── errors.ts           # Error classes
│       │   ├── validation.ts       # Zod schemas
│       │   ├── crypto.ts           # Shared crypto utils
│       │   ├── date.ts             # Date utilities
│       │   ├── id.ts               # ID generation (ULID, UUID)
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── api/                 # @aios/api - REST API Server
│   │   ├── src/
│   │   │   ├── main.ts             # Entry point
│   │   │   ├── server.ts           # Fastify/Express server
│   │   │   ├── routes/             # Route modules
│   │   │   │   ├── tbit.ts         # T-BIT routes
│   │   │   │   ├── memory.ts       # Memory routes
│   │   │   │   ├── network.ts      # Network sync routes
│   │   │   │   ├── semantic.ts     # Semantic index routes
│   │   │   │   ├── query.ts        # Query index routes
│   │   │   │   ├── guardian.ts     # Guardian routes
│   │   │   │   ├── assets.ts       # Asset routes
│   │   │   │   ├── documents.ts    # Document routes
│   │   │   │   ├── agents.ts       # Agent routes
│   │   │   │   ├── workflows.ts    # Workflow routes
│   │   │   │   ├── llm.ts          # LLM gateway routes
│   │   │   │   ├── permissions.ts  # Permission routes
│   │   │   │   ├── health.ts       # Health check routes
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # Authentication middleware
│   │   │   │   ├── validation.ts   # Request validation
│   │   │   │   ├── error.ts        # Error handling
│   │   │   │   ├── rate-limit.ts   # Rate limiting
│   │   │   │   └── cors.ts         # CORS
│   │   │   ├── services/           # Service layer (facade to packages)
│   │   │   │   ├── tbit-service.ts
│   │   │   │   ├── memory-service.ts
│   │   │   │   ├── network-service.ts
│   │   │   │   ├── semantic-service.ts
│   │   │   │   ├── query-service.ts
│   │   │   │   ├── guardian-service.ts
│   │   │   │   ├── asset-service.ts
│   │   │   │   ├── document-service.ts
│   │   │   │   ├── agent-service.ts
│   │   │   │   ├── workflow-service.ts
│   │   │   │   ├── llm-service.ts
│   │   │   │   └── permission-service.ts
│   │   │   ├── config.ts           # Configuration
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                 # @aios/web - Next.js Web App
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── memory/
│   │   │   │   ├── agents/
│   │   │   │   ├── workflows/
│   │   │   │   ├── documents/
│   │   │   │   ├── settings/
│   │   │   │   └── api/            # API routes (proxy to API server)
│   │   │   ├── components/         # React components
│   │   │   ├── lib/                # Client utilities
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── hooks/
│   │   │   ├── styles/             # Global styles
│   │   │   └── types/              # TypeScript types
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   │
│   └── desktop/             # @aios/desktop - Electron App
│       ├── src/
│       │   ├── main/               # Main process
│       │   │   ├── main.ts
│       │   │   ├── ipc.ts          # IPC handlers
│       │   │   ├── window.ts       # Window management
│       │   │   ├── menu.ts         # Application menu
│       │   │   ├── tray.ts         # System tray
│       │   │   ├── auto-updater.ts # Auto-updater
│       │   │   └── index.ts
│       │   ├── preload/            # Preload scripts
│       │   │   └── preload.ts
│       │   ├── renderer/           # Renderer process (React)
│       │   │   ├── App.tsx
│       │   │   ├── components/
│       │   │   ├── pages/
│       │   │   └── index.tsx
│       │   └── shared/             # Shared types
│       ├── package.json
│       └── tsconfig.json
│
├── tools/
│   ├── cli/                 # @aios/cli - CLI Tool
│   │   ├── src/
│   │   │   ├── commands/         # CLI commands
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │
│   └── codegen/             # @aios/codegen - Code Generation
│       ├── src/
│       │   ├── generators/
│       │   └── index.ts
│
├── docs/                    # Documentation
│   ├── architecture/
│   ├── api/
│   ├── guides/
│   └── ADR/                 # Architecture Decision Records
│
├── turbo.json               # Turborepo config
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # pnpm workspace
├── tsconfig.base.json       # Base TypeScript config
└── README.md
```

---

## 4. Core Domain Models

### 4.1 T-BIT (Temporal Bit) - The Universal Primitive

```typescript
// packages/kernel/src/tbit.ts

interface TBit<TPayload = unknown> {
  // Identity
  key: string;                    // Unique key (ULID/UUID)
  version: number;                // Monotonic version
  
  // Payload
  payload: TPayload;              // Arbitrary JSON-serializable payload
  mimeType: string;               // MIME type of payload
  
  // Temporal
  timestamp: string;              // ISO 8601 timestamp (creation)
  updatedAt: string;              // ISO 8601 timestamp (last update)
  
  // Cryptographic
  hash: string;                   // SHA-256 of canonical payload
  signature: string;              // Ed25519 signature
  keyId: string;                  // Signing key ID
  
  // Metadata
  tags: string[];                 // Searchable tags
  domain: string;                 // Domain/namespace
  collection: string;             // Collection within domain
  source: string;                 // Source identifier
  links: TBitLink[];              // Links to other T-BITs
  
  // Network (for sync)
  vectorClock: VectorClock;       // Vector clock for causality
  originNodeId: string;           // Originating node ID
}

interface TBitLink {
  key: string;                    // Target T-BIT key
  relation: LinkRelation;         // Type of relationship
  strength?: number;              // Association strength (0-1)
}

type LinkRelation = 
  | 'references' 
  | 'derived_from' 
  | 'contradicts' 
  | 'supports' 
  | 'continues' 
  | 'branches_from' 
  | 'references';

interface VectorClock {
  [nodeId: string]: number;
}
```

### 4.2 Memory Core Model

```typescript
// packages/memory/src/memory-core.ts

interface MemoryRecord extends TBit<MemoryPayload> {
  domain: 'memory';
  collection: 'episodic' | 'semantic' | 'procedural' | 'working';
}

interface MemoryPayload {
  text?: string;                    // Natural language text
  structured?: Record<string, any>; // Structured data
  embedding?: number[];             // Vector embedding
  importance: number;               // 0-1 importance score
  decayRate?: number;               // Forgetting curve parameter
  lastAccessed?: string;            // Last access timestamp
  accessCount: number;              // Access frequency
}

interface MemoryContext {
  userId: string;
  query: string;
  limit: number;
  includeGraph: boolean;
  minImportance?: number;
  timeRange?: TimeRange;
}

interface TimeRange {
  from: string;
  to: string;
}
```

### 4.3 Semantic Index Model

```typescript
// packages/semantic/src/semantic-index.ts

interface SemanticIndexConfig {
  model: string;                    // Embedding model name
  dimensions: number;               // Vector dimensions
  indexType: 'hnsw' | 'ivf' | 'flat';
  metric: 'cosine' | 'l2' | 'ip';   // Distance metric
}

interface SemanticEntry {
  key: string;                      // T-BIT key
  vector: number[];                 // Embedding vector
  metadata: SemanticMetadata;
}

interface SemanticMetadata {
  userId?: string;
  domain: string;
  collection: string;
  tags: string[];
  timestamp: string;
  textPreview: string;              // First 200 chars for preview
}

interface SemanticSearchParams {
  query: string;                    // Query text
  queryVector?: number[];           // Pre-computed query vector
  userId?: string;
  domain?: string;
  collection?: string;
  tags?: string[];
  limit: number;
  threshold?: number;               // Similarity threshold
  filter?: Record<string, any>;     // Metadata filters
}

interface SemanticSearchResult {
  key: string;
  score: number;
  metadata: SemanticMetadata;
  payload?: any;                    // Optional payload inclusion
}
```

### 4.4 Query Index Model

```typescript
// packages/query/src/query-index.ts

interface QueryIndex {
  byToken: TokenIndex;              // Inverted index by token
  byTag: TagIndex;                  // Tag-based index
  byAttribute: AttributeIndex;      // Attribute-based index
  byUser: UserIndex;                // User-based index
  bySource: SourceIndex;            // Source-based index
  byDocument: DocumentIndex;        // Document-based index
  builtAt: string;
  totalRecords: number;
}

interface TokenIndex {
  [token: string]: string[];        // Token -> T-BIT keys
}

interface TagIndex {
  [tag: string]: string[];          // Tag -> T-BIT keys
}

interface AttributeIndex {
  [attrPath: string]: {             // e.g., "payload.importance"
    [value: string]: string[];      // Value -> T-BIT keys
  };
}
```

### 4.5 Network Synchronization Model

```typescript
// packages/tbit-core/src/network-sync.ts

interface NetworkState {
  nodeId: string;
  version: number;
  tbitCount: number;
  memoryCount: number;
  lastSync: string;
  vectorClock: VectorClock;
  knownNodes: KnownNode[];
}

interface KnownNode {
  nodeId: string;
  lastSeen: string;
  vectorClock: VectorClock;
  status: 'active' | 'stale' | 'offline';
}

interface NetworkRecord {
  key: string;
  payload: string;                  // Serialized T-BIT
  checksum: string;                 // SHA-256
  networkSignature?: string;        // Network-level signature
  networkKeyId?: string;
  sourceNodeId: string;
  updatedAt: string;
  vectorClock: VectorClock;
}

interface SyncComparison {
  localOnly: string[];              // Keys only local has
  remoteOnly: string[];             // Keys only remote has
  conflicts: Conflict[];            // Conflicting keys
  identical: string[];              // Identical keys
}

interface Conflict {
  key: string;
  local: NetworkRecord;
  remote: NetworkRecord;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}
```

### 4.6 Agent Model

```typescript
// packages/agents/src/agent.ts

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  archetype: AgentArchetype;
  
  // LLM Configuration
  llm: LLMConfig;
  
  // Memory
  memory: AgentMemoryConfig;
  
  // Tools
  tools: ToolConfig[];
  
  // Permissions
  permissions: AgentPermissions;
  
  // Behavior
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  
  // Lifecycle
  autoStart: boolean;
  maxConcurrency: number;
  timeout: number;
}

type AgentArchetype = 
  | 'assistant' 
  | 'researcher' 
  | 'coder' 
  | 'analyst' 
  | 'planner' 
  | 'executor' 
  | 'critic' 
  | 'custom';

interface AgentMemoryConfig {
  userId: string;
  domains: string[];
  maxContextTokens: number;
  recallStrategy: 'recent' | 'relevant' | 'important' | 'hybrid';
  memoryTtl?: number;               // TTL in seconds
}

interface AgentPermissions {
  canReadMemory: boolean;
  canWriteMemory: boolean;
  canAccessNetwork: boolean;
  canExecuteTools: boolean;
  canSpawnAgents: boolean;
  allowedTools: string[];
  allowedDomains: string[];
  maxMemoryWritesPerMinute: number;
  maxToolCallsPerMinute: number;
}

interface ToolConfig {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: string;                  // Tool handler identifier
  permissions: string[];            // Required permissions
}
```

### 4.7 Workflow Model

```typescript
// packages/workflow/src/dsl.ts

interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config: WorkflowConfig;
}

interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  config: NodeConfig;
  position: { x: number; y: number };
}

type NodeType = 
  | 'llm' 
  | 'tool' 
  | 'condition' 
  | 'loop' 
  | 'parallel' 
  | 'subworkflow' 
  | 'human' 
  | 'transform' 
  | 'agent';

interface NodeConfig {
  // LLM node
  prompt?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  
  // Tool node
  tool?: string;
  parameters?: Record<string, any>;
  
  // Condition node
  expression?: string;
  
  // Loop node
  iterator?: string;
  maxIterations?: number;
  
  // Subworkflow
  workflowId?: string;
  
  // Transform
  template?: string;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;               // Conditional edge
}

interface WorkflowConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  persistence: boolean;
  checkpointInterval: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  state: WorkflowState;
  currentNode?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

type ExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

interface WorkflowState {
  variables: Record<string, any>;
  nodeOutputs: Record<string, any>;
  iterationCounts: Record<string, number>;
  checkpoints: Checkpoint[];
}

interface Checkpoint {
  nodeId: string;
  state: WorkflowState;
  timestamp: string;
}
```

---

## 5. Service Layer Architecture

### 5.1 Service Interface Pattern

Each domain service follows a consistent interface pattern:

```typescript
// packages/shared/src/service.ts

interface ServiceConfig {
  name: string;
  version: string;
  dependencies: string[];
}

interface ServiceLifecycle {
  initialize(config: ServiceConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, CheckResult>;
  timestamp: string;
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  durationMs: number;
}

// Base service class
abstract class BaseService implements ServiceLifecycle {
  protected config: ServiceConfig;
  protected logger: Logger;
  protected eventBus: EventBus;
  
  abstract initialize(config: ServiceConfig): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract healthCheck(): Promise<HealthStatus>;
  
  protected emit(event: string, payload: any): void;
  protected on(event: string, handler: Function): void;
}
```

### 5.2 T-BIT Core Service

```typescript
// apps/api/src/services/tbit-service.ts

interface TBitService extends ServiceLifecycle {
  // Core CRUD
  put<T>(tbit: TBit<T>): Promise<TBit<T>>;
  get<T>(key: string): Promise<TBit<T> | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  
  // Query
  query(options: TBitQueryOptions): Promise<TBitQueryResult>;
  scan(prefix: string, options?: ScanOptions): AsyncIterable<TBit>;
  
  // Indexing
  rebuildIndexes(): Promise<IndexStats>;
  getIndexStats(): Promise<IndexStats>;
  
  // Network Sync
  exportRecord(key: string): Promise<NetworkRecord>;
  importRecord(record: NetworkRecord, options?: ImportOptions): Promise<ImportResult>;
  compareState(remoteState: NetworkState): Promise<SyncComparison>;
  syncWithPeer(peerId: string): Promise<SyncResult>;
  
  // Events
  onTBitCreated(handler: (tbit: TBit) => void): void;
  onTBitUpdated(handler: (tbit: TBit) => void): void;
  onTBitDeleted(handler: (key: string) => void): void;
}

interface TBitQueryOptions {
  domain?: string;
  collection?: string;
  tags?: string[];
  source?: string;
  userId?: string;
  timeRange?: TimeRange;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'updatedAt' | 'version';
  sortOrder?: 'asc' | 'desc';
}

interface TBitQueryResult {
  items: TBit[];
  total: number;
  hasMore: boolean;
}
```

### 5.3 Memory Core Service

```typescript
// apps/api/src/services/memory-service.ts

interface MemoryService extends ServiceLifecycle {
  // Core operations
  remember(input: RememberInput): Promise<MemoryRecord>;
  recall(key: string): Promise<MemoryRecord | null>;
  context(input: ContextInput): Promise<MemoryContext>;
  
  // Graph operations
  link(sourceKey: string, targetKey: string, relation: LinkRelation, strength?: number): Promise<void>;
  unlink(sourceKey: string, targetKey: string): Promise<void>;
  getLinks(key: string): Promise<MemoryLink[]>;
  getGraph(userId?: string): Promise<MemoryGraph>;
  
  // Maintenance
  forget(key: string): Promise<boolean>;
  consolidate(userId?: string): Promise<ConsolidationReport>;
  decay(userId?: string): Promise<DecayReport>;
  
  // Index
  rebuildQueryIndex(): Promise<QueryIndexStats>;
  rebuildSemanticIndex(): Promise<SemanticIndexStats>;
}

interface RememberInput {
  userId: string;
  text?: string;
  payload?: Record<string, any>;
  key?: string;
  domain?: string;
  collection?: 'episodic' | 'semantic' | 'procedural' | 'working';
  tags?: string[];
  source?: string;
  links?: MemoryLinkInput[];
  importance?: number;
}

interface ContextInput {
  userId: string;
  query: string;
  limit?: number;
  includeGraph?: boolean;
  minImportance?: number;
  timeRange?: TimeRange;
}

interface MemoryContext {
  memories: MemoryRecord[];
  graph: MemoryGraph;
  summary: string;
  tokenCount: number;
}
```

### 5.4 Network Sync Service

```typescript
// apps/api/src/services/network-service.ts

interface NetworkService extends ServiceLifecycle {
  // State
  getState(): Promise<NetworkState>;
  getKnownNodes(): Promise<KnownNode[]>;
  
  // Sync
  exportRecord(key: string): Promise<NetworkRecord>;
  importRecord(record: NetworkRecord, options?: ImportOptions): Promise<ImportResult>;
  compareState(remoteState: NetworkState): Promise<SyncComparison>;
  syncWithPeer(peerId: string): Promise<SyncResult>;
  broadcastRecord(record: NetworkRecord): Promise<BroadcastResult>;
  
  // Peer management
  addPeer(peer: PeerInfo): Promise<void>;
  removePeer(peerId: string): Promise<void>;
  getPeerStatus(peerId: string): Promise<PeerStatus>;
  
  // Anti-entropy
  runAntiEntropy(): Promise<AntiEntropyReport>;
  scheduleAntiEntropy(intervalMs: number): void;
  
  // Events
  onPeerConnected(handler: (peer: PeerInfo) => void): void;
  onPeerDisconnected(handler: (peerId: string) => void): void;
  onSyncComplete(handler: (result: SyncResult) => void): void;
}

interface PeerInfo {
  nodeId: string;
  addresses: string[];
  publicKey: string;
  metadata?: Record<string, any>;
}

interface ImportOptions {
  force?: boolean;
  allowDowngrade?: boolean;
  verifySignature?: boolean;
}
```

### 5.5 Semantic Index Service

```typescript
// apps/api/src/services/semantic-service.ts

interface SemanticService extends ServiceLifecycle {
  // Search
  search(params: SemanticSearchParams): Promise<SemanticSearchResult[]>;
  
  // Index management
  rebuild(): Promise<SemanticIndexStats>;
  getStats(): Promise<SemanticIndexStats>;
  addEntry(entry: SemanticEntry): Promise<void>;
  removeEntry(key: string): Promise<void>;
  updateEntry(key: string, vector: number[], metadata: SemanticMetadata): Promise<void>;
  
  // Embeddings
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  
  // Configuration
  getConfig(): Promise<SemanticIndexConfig>;
  updateConfig(config: Partial<SemanticIndexConfig>): Promise<void>;
}
```

### 5.6 Agent Runtime Service

```typescript
// apps/api/src/services/agent-service.ts

interface AgentService extends ServiceLifecycle {
  // Agent lifecycle
  createAgent(config: AgentConfig): Promise<AgentInstance>;
  getAgent(agentId: string): Promise<AgentInstance | null>;
  listAgents(): Promise<AgentInstance[]>;
  startAgent(agentId: string): Promise<void>;
  stopAgent(agentId: string): Promise<void>;
  deleteAgent(agentId: string): Promise<boolean>;
  
  // Execution
  runAgent(agentId: string, input: AgentInput): Promise<AgentOutput>;
  streamAgent(agentId: string, input: AgentInput): AsyncIterable<AgentStreamEvent>;
  
  // Templates
  getTemplates(): Promise<AgentTemplate[]>;
  createFromTemplate(templateId: string, overrides: Partial<AgentConfig>): Promise<AgentInstance>;
  
  // Monitoring
  getAgentMetrics(agentId: string): Promise<AgentMetrics>;
  getAllMetrics(): Promise<AgentMetrics[]>;
}

interface AgentInstance {
  config: AgentConfig;
  status: AgentStatus;
  metrics: AgentMetrics;
  createdAt: string;
  startedAt?: string;
}

type AgentStatus = 'created' | 'starting' | 'running' | 'paused' | 'stopped' | 'error';

interface AgentInput {
  message: string;
  context?: Record<string, any>;
  attachments?: Attachment[];
  stream?: boolean;
}

interface AgentOutput {
  response: string;
  toolCalls: ToolCall[];
  memoryWrites: MemoryRecord[];
  tokensUsed: TokenUsage;
  durationMs: number;
}

interface AgentStreamEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'memory_write' | 'complete' | 'error';
  data: any;
}
```

### 5.7 Workflow Engine Service

```typescript
// apps/api/src/services/workflow-service.ts

interface WorkflowService extends ServiceLifecycle {
  // Definition management
  createWorkflow(definition: WorkflowDefinition): Promise<WorkflowDefinition>;
  getWorkflow(workflowId: string): Promise<WorkflowDefinition | null>;
  listWorkflows(): Promise<WorkflowDefinition[]>;
  updateWorkflow(workflowId: string, definition: Partial<WorkflowDefinition>): Promise<WorkflowDefinition>;
  deleteWorkflow(workflowId: string): Promise<boolean>;
  
  // Execution
  execute(workflowId: string, input: Record<string, any>, options?: ExecutionOptions): Promise<WorkflowExecution>;
  executeAsync(workflowId: string, input: Record<string, any>, options?: ExecutionOptions): Promise<string>; // Returns execution ID
  getExecution(executionId: string): Promise<WorkflowExecution | null>;
  listExecutions(workflowId?: string, status?: ExecutionStatus): Promise<WorkflowExecution[]>;
  cancelExecution(executionId: string): Promise<boolean>;
  retryExecution(executionId: string): Promise<WorkflowExecution>;
  
  // Real-time
  subscribeToExecution(executionId: string, handler: (event: ExecutionEvent) => void): () => void;
  
  // Templates
  getTemplates(): Promise<WorkflowTemplate[]>;
}

interface ExecutionOptions {
  variables?: Record<string, any>;
  checkpoint?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
}

interface ExecutionEvent {
  type: 'node_start' | 'node_complete' | 'node_error' | 'workflow_complete' | 'workflow_error';
  executionId: string;
  nodeId?: string;
  timestamp: string;
  data: any;
}
```

---

## 6. API Gateway Layer

### 6.1 Route Structure

```
/api/v1/
├── /tbit
│   ├── GET    /:key                    # Get T-BIT
│   ├── PUT    /:key                    # Put T-BIT
│   ├── DELETE /:key                    # Delete T-BIT
│   ├── POST   /query                   # Query T-BITs
│   ├── POST   /scan                    # Scan T-BITs
│   ├── GET    /stats                   # Index stats
│   └── POST   /rebuild-indexes         # Rebuild indexes
│
├── /memory
│   ├── POST   /remember                # Remember memory
│   ├── POST   /recall                  # Recall memory
│   ├── POST   /context                 # Get context
│   ├── POST   /links                   # Get links
│   ├── GET    /graph                   # Get memory graph
│   ├── POST   /link                    # Create link
│   ├── DELETE /link                    # Remove link
│   ├── POST   /forget                  # Forget memory
│   ├── POST   /consolidate             # Consolidate memories
│   └── POST   /decay                   # Apply decay
│
├── /network
│   ├── GET    /state                   # Network state
│   ├── POST   /export-record           # Export record
│   ├── POST   /import-record           # Import record
│   ├── POST   /compare                 # Compare state
│   ├── POST   /sync/:peerId            # Sync with peer
│   ├── GET    /peers                   # List peers
│   ├── POST   /peers                   # Add peer
│   ├── DELETE /peers/:peerId           # Remove peer
│   └── POST   /anti-entropy            # Run anti-entropy
│
├── /semantic
│   ├── POST   /search                  # Semantic search
│   ├── GET    /stats                   # Index stats
│   ├── POST   /rebuild                 # Rebuild index
│   └── POST   /embed                   # Generate embeddings
│
├── /query
│   ├── POST   /search                  # Query search
│   ├── GET    /stats                   # Index stats
│   └── POST   /rebuild                 # Rebuild index
│
├── /guardian
│   ├── POST   /observe                 # Run observation
│   ├── GET    /report/:id              # Get report
│   ├── POST   /reconcile               # Reconcile
│   └── GET    /policies                # Get policies
│
├── /assets
│   ├── GET    /list                    # List assets
│   ├── GET    /stats                   # Asset stats
│   ├── POST   /import-binary           # Import binary
│   ├── POST   /reconstruct-binary      # Reconstruct binary
│   ├── POST   /delete-binary           # Delete binary
│   └── DELETE /:assetKey               # Delete asset
│
├── /documents
│   ├── POST   /import                  # Import document
│   ├── POST   /preview                 # Preview markdown
│   ├── GET    /list                    # List markdown
│   ├── POST   /reconstruct             # Reconstruct markdown
│   └── DELETE /:key                    # Delete markdown
│
├── /agents
│   ├── POST   /                        # Create agent
│   ├── GET    /                        # List agents
│   ├── GET    /:id                     # Get agent
│   ├── PUT    /:id                     # Update agent
│   ├── DELETE /:id                     # Delete agent
│   ├── POST   /:id/start               # Start agent
│   ├── POST   /:id/stop                # Stop agent
│   ├── POST   /:id/run                 # Run agent
│   ├── POST   /:id/stream              # Stream agent
│   ├── GET    /templates               # Get templates
│   └── POST   /from-template           # Create from template
│
├── /workflows
│   ├── POST   /                        # Create workflow
│   ├── GET    /                        # List workflows
│   ├── GET    /:id                     # Get workflow
│   ├── PUT    /:id                     # Update workflow
│   ├── DELETE /:id                     # Delete workflow
│   ├── POST   /:id/execute             # Execute workflow
│   ├── POST   /:id/execute-async       # Execute async
│   ├── GET    /executions              # List executions
│   ├── GET    /executions/:id          # Get execution
│   ├── POST   /executions/:id/cancel   # Cancel execution
│   ├── POST   /executions/:id/retry    # Retry execution
│   └── GET    /templates               # Get templates
│
├── /llm
│   ├── POST   /chat                    # Chat completion
│   ├── POST   /chat/stream             # Streaming chat
│   ├── POST   /embeddings              # Generate embeddings
│   ├── GET    /models                  # List models
│   ├── GET    /providers               # List providers
│   └── POST   /tools/call              # Call tool
│
├── /permissions
│   ├── GET    /                        # Get policy
│   └── POST   /                        # Update policy
│
└── /health
    ├── GET    /                        # Health check
    ├── GET    /container               # Container health
    └── POST   /reconcile               # Reconcile health
```

### 6.2 Middleware Stack

```typescript
// apps/api/src/middleware/index.ts

const middlewareStack = [
  // 1. Request ID
  requestId(),
  
  // 2. Logging
  logger({ level: 'info' }),
  
  // 3. CORS
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
  
  // 4. Body parsing
  bodyParser({
    json: { limit: '10mb' },
    raw: { limit: '50mb', type: 'application/octet-stream' },
  }),
  
  // 5. Rate limiting
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // requests per window
    keyGenerator: (req) => req.ip,
  }),
  
  // 6. Authentication
  authenticate([
    hmacAuth(),      // HMAC-SHA256 for service-to-service
    jwtAuth(),       // JWT for user sessions
    apiKeyAuth(),    // API key for external access
  ]),
  
  // 7. Authorization
  authorize(),
  
  // 8. Request validation
  validateRequest(),
  
  // 9. Error handling
  errorHandler(),
  
  // 10. Response compression
  compression(),
];

// Authentication middleware
function authenticate(strategies: AuthStrategy[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const strategy of strategies) {
      const result = await strategy.authenticate(req);
      if (result) {
        req.auth = result;
        return next();
      }
    }
    // Allow unauthenticated for health checks
    if (req.path.startsWith('/health')) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  };
}
```

---

## 7. Data Flow Patterns

### 7.1 Write Path (T-BIT Creation)

```
Client Request
      │
      ▼
┌─────────────────┐
│  API Gateway    │ ──► Validate, Auth, Rate Limit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  T-BIT Service  │ ──► Validate T-BIT structure
│                 │     Generate key (if not provided)
│                 │     Compute hash
│                 │     Sign with node key
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Storage Layer  │ ──► Write to WAL (Write-Ahead Log)
│  (SQLite/WAL)   │     Write to main table
│                 │     Update indexes (async)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Index Update   │ ──► Update Query Index (tokens, tags, attrs)
│  (Async)        │     Update Semantic Index (embed + vector insert)
│                 │     Update Memory Graph (links)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Network Sync   │ ──► Add to outbound sync queue
│  (Async)        │     Gossip to peers (anti-entropy)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Event Bus      │ ──► Emit TBitCreated event
│                 │     Agents/Workflows can subscribe
└─────────────────┘
```

### 7.2 Read Path (Semantic Search)

```
Client Request (POST /api/v1/semantic/search)
      │
      ▼
┌─────────────────┐
│  API Gateway    │ ──► Validate, Auth
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Semantic Svc   │ ──► Generate query embedding
│                 │     (or use provided vector)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Search  │ ──► HNSW/IVF search in sqlite-vec
│  (sqlite-vec)   │     Filter by metadata (userId, domain, tags)
│                 │     Return top-k results with scores
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hydration      │ ──► Fetch full T-BIT payloads (optional)
│  (Optional)     │     Apply permissions filter
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │ ──► Format results
│  Formatting     │     Add metadata, pagination
└────────┬────────┘
         │
         ▼
   Client Response
```

### 7.3 Network Sync (Anti-Entropy)

```
Periodic Timer / Manual Trigger
      │
      ▼
┌─────────────────┐
│  Anti-Entropy   │
│  Coordinator    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Select Peer    │────►│  Compare State  │
│  (Random/Oldest)│     │  (Vector Clock) │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │ Local    │ │ Remote   │ │ Conflicts│
             │ Only     │ │ Only     │ │          │
             └────┬─────┘ └────┬─────┘ └────┬─────┘
                  │            │            │
                  ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │ Send to  │ │ Request  │ │ Resolve  │
             │ Peer     │ │ from Peer│ │ (LWW/    │
             └──────────┘ └──────────┘ │  Merge)  │
                                       └──────────┘
                  │            │            │
                  └────────────┼────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Merge &     │
                        │  Persist     │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Update      │
                        │  Vector      │
                        │  Clock       │
                        └──────────────┘
```

### 7.4 Agent Execution Flow

```
User Request (POST /api/v1/agents/:id/run)
      │
      ▼
┌─────────────────┐
│  Agent Service  │ ──► Load agent config
│                 │     Check permissions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Memory Recall  │ ──► Get relevant context from Memory Core
│                 │     (semantic + query index + graph)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Gateway    │ ──► Build prompt (system + context + user)
│                 │     Select model (routing/fallback)
│                 │     Execute with tools
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tool Execution │ ──► Execute tool calls
│  (Parallel)     │     Handle streaming
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Memory Write   │ ──► Store new memories (episodic)
│  (Async)        │     Update semantic index
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │ ──► Format output
│  Formatting     │     Include citations, tool results
└────────┬────────┘
         │
         ▼
   Client Response
```

---

## 8. Deployment Architecture

### 8.1 Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # API Server
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./data/aios.db
      - VECTOR_DB_URL=file:./data/aios-vec.db
      - LLM_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://ollama:11434
      - LOG_LEVEL=debug
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
      - aios-data:/app/data
    depends_on:
      - ollama
    command: pnpm dev

  # Web App
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages/ui:/app/packages/ui
    command: pnpm dev

  # Ollama (Local LLM)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # SQLite Browser (Development)
  sqlite-browser:
    image: colek42/sqlite-web:latest
    ports:
      - "8080:8080"
    volumes:
      - aios-data:/data
    command: /data/aios.db

volumes:
  aios-data:
  ollama-data:
```

### 8.2 Production Deployment (Kubernetes)

```yaml
# k8s/aios-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aios-api
  namespace: aios
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aios-api
  template:
    metadata:
      labels:
        app: aios-api
    spec:
      containers:
        - name: api
          image: muf-labs/aios-api:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: aios-secrets
                  key: database-url
            - name: VECTOR_DB_URL
              valueFrom:
                secretKeyRef:
                  name: aios-secrets
                  key: vector-db-url
            - name: LLM_PROVIDER
              value: "openai"
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: aios-secrets
                  key: openai-api-key
            - name: HMAC_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aios-secrets
                  key: hmac-key-id
            - name: HMAC_SECRET
              valueFrom:
                secretKeyRef:
                  name: aios-secrets
                  key: hmac-secret
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: aios-api
  namespace: aios
spec:
  selector:
    app: aios-api
  ports:
    - port: 80
      targetPort: 3001
  type: ClusterIP
```

### 8.3 Desktop Application Packaging

```json
// apps/desktop/package.json
{
  "name": "@aios/desktop",
  "version": "1.0.0",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "concurrently \"pnpm:dev:main\" \"pnpm:dev:renderer\"",
    "dev:main": "tsx watch src/main/main.ts",
    "dev:renderer": "vite",
    "build": "pnpm:build:main && pnpm:build:renderer",
    "build:main": "tsc -p tsconfig.main.json",
    "build:renderer": "vite build",
    "package": "electron-builder",
    "dist": "pnpm build && electron-builder --publish=never"
  },
  "build": {
    "appId": "com.muflabs.aios",
    "productName": "AIOS",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "../api/dist",
        "to": "api",
        "filter": ["**/*"]
      }
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  }
}
```

---

## 9. Security Architecture

### 9.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   HMAC      │  │    JWT      │  │   API Key   │              │
│  │   (Service) │  │   (User)    │  │  (External) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│              ┌─────────────────────┐                             │
│              │  Auth Resolver      │                             │
│              │  (Strategy Pattern) │                             │
│              └──────────┬──────────┘                             │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  Principal          │                             │
│              │  { id, type,        │                             │
│              │   permissions,      │                             │
│              │   metadata }        │                             │
│              └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Permission Model

```typescript
// packages/kernel/src/permissions.ts

interface PermissionPolicy {
  version: string;
  updatedAt: string;
  updatedBy: string;
  rules: PermissionRule[];
  roles: RoleDefinition[];
}

interface PermissionRule {
  id: string;
  effect: 'allow' | 'deny';
  principal: PrincipalMatcher;
  resource: ResourceMatcher;
  actions: ActionMatcher[];
  conditions?: Condition[];
}

interface PrincipalMatcher {
  type: 'user' | 'agent' | 'service' | 'any';
  ids?: string[];
  roles?: string[];
  attributes?: Record<string, any>;
}

interface ResourceMatcher {
  type: 'tbit' | 'memory' | 'network' | 'semantic' | 'query' | 
        'guardian' | 'asset' | 'document' | 'agent' | 'workflow' | 'llm' | 'any';
  domains?: string[];
  collections?: string[];
  keys?: string[];
  tags?: string[];
}

type ActionMatcher = 
  | 'read' 
  | 'write' 
  | 'delete' 
  | 'execute' 
  | 'admin' 
  | 'sync'
  | 'search'
  | 'embed'
  | 'chat'
  | 'deploy';

interface Condition {
  type: 'time' | 'ip' | 'rate' | 'custom';
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin';
  value: any;
}
```

### 9.3 Cryptographic Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRYPTOGRAPHIC PRIMITIVES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Ed25519    │    │   SHA-256    │    │   HMAC       │      │
│  │   Signing    │    │   Hashing    │    │   (API Auth) │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    T-BIT Signing                         │   │
│  │  1. Canonicalize payload (sorted keys, no whitespace)    │   │
│  │  2. Compute SHA-256 hash                                 │   │
│  │  3. Sign hash with Ed25519 private key                   │   │
│  │  4. Store: hash, signature, keyId, timestamp             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Network Signatures                     │   │
│  │  - Each node has Ed25519 key pair                        │   │
│  │  - Network records signed by origin node                 │   │
│  │  - Gossip messages signed for authenticity               │   │
│  │  - Merkle proofs for state verification                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Configuration Management

### 10.1 Configuration Schema

```typescript
// packages/shared/src/config.ts

interface AIOSConfig {
  // Environment
  env: 'development' | 'staging' | 'production';
  nodeId: string;
  
  // API Server
  api: APIConfig;
  
  // Storage
  storage: StorageConfig;
  
  // Vector Database
  vector: VectorConfig;
  
  // LLM Gateway
  llm: LLMConfig;
  
  // Network
  network: NetworkConfig;
  
  // Security
  security: SecurityConfig;
  
  // Monitoring
  monitoring: MonitoringConfig;
  
  // Feature flags
  features: FeatureFlags;
}

interface APIConfig {
  host: string;
  port: number;
  corsOrigin: string | string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  requestLimits: {
    json: string;
    raw: string;
  };
}

interface StorageConfig {
  type: 'sqlite' | 'libsql' | 'postgres';
  connectionString: string;
  poolSize: number;
  enableWAL: boolean;
  migrationDir: string;
}

interface VectorConfig {
  type: 'sqlite-vec' | 'pgvector' | 'memory';
  connectionString: string;
  dimensions: number;
  indexType: 'hnsw' | 'ivf' | 'flat';
  metric: 'cosine' | 'l2' | 'ip';
}

interface LLMConfig {
  defaultProvider: string;
  providers: Record<string, LLMProviderConfig>;
  routing: LLMRoutingConfig;
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

interface LLMProviderConfig {
  type: 'ollama' | 'openai' | 'anthropic' | 'openai-compatible';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  timeout: number;
  maxRetries: number;
}

interface LLMRoutingConfig {
  strategy: 'priority' | 'fallback' | 'round-robin' | 'cost-optimized';
  fallbackChain: string[];
}

interface NetworkConfig {
  enabled: boolean;
  nodeId: string;
  listenAddresses: string[];
  bootstrapPeers: string[];
  gossipInterval: number;
  antiEntropyInterval: number;
  maxPeers: number;
  enableWebRTC: boolean;
  enableMDNS: boolean;
}

interface SecurityConfig {
  hmac: {
    keyId: string;
    secret: string;
    algorithm: string;
  };
  jwt: {
    secret: string;
    issuer: string;
    audience: string;
    expiresIn: string;
  };
  apiKeys: {
    enabled: boolean;
    headerName: string;
    prefix: string;
  };
  encryption: {
    algorithm: string;
    keyRotationInterval: number;
  };
  permissions: {
    policyFile: string;
    defaultDeny: boolean;
  };
}

interface MonitoringConfig {
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
    destination: 'console' | 'file' | 'both';
    filePath?: string;
  };
  metrics: {
    enabled: boolean;
    port: number;
    path: string;
  };
  tracing: {
    enabled: boolean;
    sampler: 'always' | 'never' | 'traceidratio';
    ratio?: number;
    exporter: 'jaeger' | 'zipkin' | 'otlp';
    endpoint?: string;
  };
  healthChecks: {
    interval: number;
    timeout: number;
  };
}

interface FeatureFlags {
  enableSemanticSearch: boolean;
  enableNetworkSync: boolean;
  enableAgents: boolean;
  enableWorkflows: boolean;
  enableGuardian: boolean;
  enableAssets: boolean;
  enableDocuments: boolean;
  enableCodeGraph: boolean;
  enableWebResearch: boolean;
}
```

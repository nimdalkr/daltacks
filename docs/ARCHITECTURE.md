# Daltacks Architecture

## MVP Goal

`Daltacks` is a minimal Stacks accountability tracker. Each wallet can maintain one active snapshot. The chain stores only the commitment hash, deadline block height, check-in count, and latest proof hash. Human-readable habit text remains off-chain.

## Monorepo Layout

```text
.
├── contracts/
│   └── tracker.clar
├── docs/
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE.md
│   └── SECURITY.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── packages/
│   ├── stx-utils/
│   └── tracker-sdk/
├── Clarinet.toml
├── package.json
└── tsconfig.base.json
```

## Frozen Interfaces

```ts
interface SnapshotRecord {
  id: number;
  owner: string;
  commitmentHash: string;
  createdAtHeight: number;
  dueAtHeight: number;
  checkInCount: number;
  lastProofHash: string | null;
  lastCheckInHeight: number | null;
}

interface TrackerSdk {
  getActiveSnapshot(owner: string, transport: TrackerTransport): Promise<SnapshotRecord | null>;
  getSnapshot(snapshotId: number, transport: TrackerTransport): Promise<SnapshotRecord | null>;
  buildCreateSnapshotTx(input: CreateSnapshotInput): ContractCallDraft;
  buildCheckInTx(input: CheckInInput): ContractCallDraft;
}
```

## Data Flow

### Read Path

1. User enters or connects a Stacks principal.
2. Frontend query calls `sdk.getActiveSnapshot(address, transport)`.
3. Transport hits Stacks read-only endpoints and Hiro balances.
4. UI renders status, deadline, check-in count, and latest proof marker.

### Write Path

1. User enters a private commitment or proof note.
2. Browser hashes the text with SHA-256.
3. SDK builds a typed tx draft for `create-snapshot` or `check-in`.
4. Frontend opens `@stacks/connect`.
5. Query cache invalidates after confirmation or optimistic finish.

## Guardrail

If a feature does not directly support snapshot creation, snapshot lookup, or proof check-ins, it stays out of MVP.


# API Reference

## Contract

### Public

`(create-snapshot (commitment-hash (buff 32)) (due-at-height uint))`

`(check-in (proof-hash (buff 32)))`

### Read-only

`(get-active-snapshot (owner principal))`

`(get-snapshot (snapshot-id uint))`

`(get-snapshot-id-by-owner (owner principal))`

## SDK

### Read

```ts
sdk.getActiveSnapshot(owner, transport);
sdk.getSnapshot(snapshotId, transport);
```

### Write

```ts
sdk.buildCreateSnapshotTx({ commitmentHashHex, dueAtHeight });
sdk.buildCheckInTx({ proofHashHex });
```


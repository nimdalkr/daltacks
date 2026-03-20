# Security Notes

## MVP Scope

The contract has no admin, no STX custody, no helper contract calls, and no reward logic.

## Privacy

Only commitment hashes and latest proof hashes are stored on-chain. Raw text remains local until the user chooses to reveal it elsewhere.

## Write Safety

- `tx-sender` is the only source of write identity.
- Users can only create or update their own active snapshot.
- Frontend should use deny-mode post conditions by default.

## Future Risks If Scope Expands

Adding stake, rewards, or pooled balances requires separate threat modeling and should not be mixed into this MVP contract.


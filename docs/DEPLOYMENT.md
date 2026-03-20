# Deployment

## Vercel

This repository is a workspace monorepo. The frontend imports local packages from `packages/`, so the safest Vercel setup is to build from the repository root.

### Recommended project settings

- Root Directory: repository root
- Install Command: `npm install`
- Build Command: `npm run vercel-build`
- Output Directory: `frontend/dist`

The included [vercel.json](/C:/Users/Admin/Desktop/5_Crypto/Stacks/daltacks/vercel.json) already reflects that setup.

### Required frontend environment variables

Use [frontend/.env.example](/C:/Users/Admin/Desktop/5_Crypto/Stacks/daltacks/frontend/.env.example) as the base:

- `VITE_STACKS_NETWORK`
- `VITE_STACKS_API_BASE_URL`
- `VITE_CONTRACT_ADDRESS`
- `VITE_CONTRACT_NAME`

For testnet, a typical set is:

```env
VITE_STACKS_NETWORK=testnet
VITE_STACKS_API_BASE_URL=https://api.testnet.hiro.so
VITE_CONTRACT_ADDRESS=ST...
VITE_CONTRACT_NAME=tracker
```

## Contract Deployment

### Local devnet

Local Clarinet simnet/devnet uses [settings/Devnet.toml](/C:/Users/Admin/Desktop/5_Crypto/Stacks/daltacks/settings/Devnet.toml).

Run:

```bash
npm run test
```

### Testnet

1. Replace the placeholder mnemonic in [settings/Testnet.toml](/C:/Users/Admin/Desktop/5_Crypto/Stacks/daltacks/settings/Testnet.toml).
2. Generate a deployment plan with Clarinet.
3. Apply the deployment to testnet.
4. Copy the deployed contract principal into the frontend Vercel env vars.

Example flow:

```bash
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet
```

### Mainnet

1. Replace the placeholder mnemonic in [settings/Mainnet.toml](/C:/Users/Admin/Desktop/5_Crypto/Stacks/daltacks/settings/Mainnet.toml).
2. Generate and inspect the deployment plan.
3. Apply the deployment only after verifying the contract name and deployer principal.

## Why Root Build Matters

Vercel documents that apps in a configured Root Directory cannot access files outside that directory unless you explicitly enable that behavior. Since this frontend consumes local workspace packages, root-based builds are the least fragile default for this repository.

Sources:

- Vercel root directory behavior: https://vercel.com/docs/deployments/configure-a-build
- Vercel monorepo support: https://vercel.com/docs/monorepos/monorepo-faq
- Stacks developer quickstart settings example: https://docs.stacks.co/get-started/developer-quickstart

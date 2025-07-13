# VIVON Platform

The first integrated learn-and-earn Web3 ecosystem where users master AI engineering, cybersecurity, and Web3 development while earning real VIVON tokens and NFT achievements on Sui blockchain.

## Overview

VIVON solves the problem of fragmented, theoretical learning in Web3 and AI technologies by creating a comprehensive platform that combines hands-on challenges, real bounties, token rewards, and NFT achievements in one ecosystem.

## Features

### Multi-Category Bounty System
- AI Jailbreak, Security, DeFi, and Gaming bounties
- Real VIVON token rewards with oracle-verified automatic payouts
- Hash-based secure submissions protecting intellectual property
- Economic security via attempt fees preventing spam

### Interactive Challenge System
- AI engineering practice quests
- Cybersecurity hands-on challenges
- Web3 development tutorials
- 5-minute quests with instant VIVON rewards

### AI Helper Ecosystem
- Sui blockchain development assistant
- Interactive AI for learning support
- Technical guidance and code help
- Integration with Sui documentation

### Complete Token Economy
- Native VIVON token (10M supply, 9 decimals)
- Real DEX with SUI ↔ VIVON swaps
- MintCapability for controlled distribution
- Time-locked rewards for achievements

### NFT Achievement System
- Winner badges for bounty success
- Edition-based collectibles based on token holdings
- Permanent skill verification on-chain

### Integrated Dashboard
- Profile management with all balances
- Transaction monitoring and history
- Network switching (testnet/mainnet)
- Real-time blockchain event tracking

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Sui dApp Kit** - Wallet integration and blockchain interactions
- **Lucide React** - Icon system

### Blockchain
- **Sui Blockchain** - Object-centric blockchain platform
- **Move Language** - Smart contract development
- **Sui TypeScript SDK** - Frontend blockchain integration

### Smart Contracts
- **Package ID**: `0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7`
- **Network**: Sui Testnet (ready for mainnet)

## Contract Architecture

### Core Objects

**BountyPool** (Shared Object)
```move
public struct BountyPool has key {
    id: UID,
    balance: Balance<SUI>,
    attempt_fee: u64,
    spec_uri: vector<u8>,
    oracle_cap_id: ID
}
```

**Submission** (Owned Object)
```move
public struct Submission has key {
    id: UID,
    pool_id: ID,
    hunter: address,
    hash: vector<u8>,
    status: u8
}
```

**VIVON Token** with Time-Locking
```move
public struct VIVON has drop {}

public struct Locker has key, store {
    id: UID,
    unlock_date: u64,
    balance: Balance<VIVON>,
}
```

**VivonNFT** (Collectible System)
```move
public struct VivonNFT has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: String,
    edition: u64,
    creator: address,
    created_at: u64,
}
```

### Key Functions
- `bounty::create_pool()` - Automated escrow system
- `bounty::submit()` - Hash-based secure submissions
- `vivon::mint()` - Controlled token minting
- `vivon_nft::mint_holder_badge()` - Achievement NFTs
- Oracle verification with Move contracts

## Project Structure

```
/
├── app/                          # Next.js frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Application pages
│   │   ├── context/            # React context providers
│   │   ├── services/           # Blockchain service layer
│   │   ├── constants/          # Configuration constants
│   │   └── styles/             # Global styles
│   ├── public/                 # Static assets
│   └── package.json           # Frontend dependencies
├── contracts/                   # Sui Move smart contracts
│   ├── sources/               # Move source files
│   │   ├── bounty.move       # Core bounty system
│   │   ├── vivon.move        # VIVON token with time-locking
│   │   ├── vivon_nft.move    # NFT collectible system
│   │   └── badge.move        # Achievement badges
│   ├── tests/                # Contract unit tests
│   └── Move.toml            # Package configuration
└── cli/                       # Development and deployment scripts
```

## Development Setup

### Prerequisites
- Node.js 18+
- Sui CLI
- Git

### Frontend Development
```bash
cd app
npm install
npm run dev
```

### Smart Contract Development
```bash
cd contracts
sui move build
sui move test
```

### Deployment
```bash
# Deploy contracts to testnet
sui client publish --gas-budget 100000000

# Update package constants
# Edit app/src/constants/networkList.ts with new package ID
```

## Sui Architecture Benefits

### Object Model
- **BountyPool** (shared) enables parallel submissions from multiple users
- **Submission** (owned) provides secure user asset management
- **OracleCap** (owned) implements capability-based access control
- **VivonNFT** (owned) supports collectible ownership and trading

### Performance & Security
- Parallel transaction execution for multiple bounty submissions
- Hash-based submissions protect intellectual property until approval
- Capability-based oracle system with scoped authority
- Economic security via attempt fees and time-locked rewards

## Testing

### Contract Tests
```bash
cd contracts
sui move test
```

### Frontend Tests
```bash
cd app
npm run test
```

## Live Deployment

**Testnet**: https://your-domain.com
**Package ID**: `0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7`
**Explorer**: [View on Sui Explorer](https://suiexplorer.com/object/0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7?network=testnet)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
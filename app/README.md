# VIVON Platform Frontend

The frontend application for VIVON Platform - the first integrated learn-and-earn Web3 ecosystem where users master AI engineering, cybersecurity, and Web3 development while earning real VIVON tokens and NFT achievements on Sui blockchain.

## Overview

This Next.js application provides the user interface for the VIVON Platform, featuring:
- Multi-category bounty system with real token rewards
- Interactive AI-powered learning challenges
- Sui blockchain integration for secure transactions
- NFT achievement system
- Comprehensive dashboard for tracking progress and earnings

## Tech Stack

* **[Next.js 14](https://nextjs.org/)**: React framework with App Router and optimized page routing
* **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development
* **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
* **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed, accessible React components
* **[@mysten/dapp-kit](https://www.npmjs.com/package/@mysten/dapp-kit)**: Sui wallet integration and blockchain queries
* **[Lucide React](https://lucide.dev/)**: Beautiful icon system

## Features

### Core Pages
- **Dashboard**: User profile, balances, and transaction history
- **Bounties**: Browse and participate in AI, security, DeFi, and gaming challenges
- **Challenges**: Interactive learning quests with instant rewards
- **AI Helpers**: Specialized AI assistants for different domains
- **Profile**: Personal achievement tracking and NFT collection

### Smart Contract Integration
- **Sui Blockchain**: Native integration with Sui testnet/mainnet
- **VIVON Token**: Real token rewards with time-locking capabilities
- **NFT System**: Achievement badges and collectibles
- **Bounty System**: Secure escrow and hash-based submissions

## Key Components

### Navigation & Layout
```typescript
import Navigation from "@/components/navigation";
import { DashboardContainer } from "@/components/containers/dashboardContainer";
```

### Wallet Integration
```typescript
import { WalletContext } from "@/context/WalletContext";
import { ConnectMenu } from "@/components/ui/connectMenu";
```

### Chat Interface
```typescript
import { ChatWindow } from "@/components/chat/ChatWindow";

<ChatWindow
  endpoint="/api/chat/sui_assistant"
  agentIcon={<Bot className="w-5 h-5" />}
  placeholder="Ask me about Sui development..."
/>
```

### Form Components
```typescript
import { BasicInputField } from "@/components/fields/basicInputField";
import { BasicDataField } from "@/components/fields/basicDataField";
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## Environment Variables

```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7
NEXT_PUBLIC_RPC_URL=https://fullnode.testnet.sui.io
```

## Smart Contract Integration

The frontend integrates with Move smart contracts deployed on Sui:

- **Bounty System**: Secure escrow and submissions
- **VIVON Token**: Native token with time-locking
- **NFT Achievements**: On-chain skill verification
- **Oracle Integration**: Automated reward verification

## Development

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── chat/           # Chat interface components
│   ├── fields/         # Form and data display components
│   └── ui/             # Base UI components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages
├── services/           # Blockchain service layer
├── constants/          # Configuration constants
└── styles/             # Global styles
```

### Key Services
- **SuiService**: Blockchain interactions
- **DexService**: Token swapping functionality
- **Oracle**: Price feeds and verification

## Deployment

The application is configured for deployment on Vercel with automatic builds from the main branch.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

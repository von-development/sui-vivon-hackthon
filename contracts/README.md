# VIVON Platform - Smart Contracts

## AI Safety Bounty Platform on Sui

VIVON is a decentralized platform for crowdsourcing AI safety research through bounty mechanisms. Built on Sui blockchain, it leverages Sui's object-centric architecture to create a scalable, secure, and efficient bounty system for AI jailbreaking and safety testing.

## Architecture Overview

The platform consists of four core smart contract modules, each serving a specific purpose in the AI safety bounty ecosystem:

### Core Modules

**bounty.move** - The main bounty management system that handles the creation of AI safety challenges, submission processing, and reward distribution.

**vivon.move** - The platform's native token system featuring time-locked vesting capabilities and controlled supply mechanisms.

**vivon_nft.move** - A collectible NFT system for commemorating significant AI safety discoveries and building researcher reputation.

**badge.move** - Winner badge system that provides permanent credentials for successful bounty hunters.

## Contract Details

### Bounty System (bounty.move)

The bounty system enables the creation of AI safety challenges where researchers can submit their findings for review and potential rewards. Key features include:

**BountyPool**: Shared objects that serve as escrow vaults for individual AI safety challenges. Each pool contains the prize money, attempt fees, challenge specifications, and oracle authorization.

**Submission System**: Researchers submit cryptographic hashes of their AI jailbreak attempts along with attempt fees. This hash-based approach protects intellectual property until approval.

**Oracle Verification**: Trusted experts review submissions and approve successful ones. Oracle capabilities are scoped to specific bounty pools for security.

**Dual Payout Options**: Winners can receive payouts with or without commemorative badges, providing flexibility in reward structures.

### Token System (vivon.move)

The VIVON token serves as the platform's native currency with advanced features:

**Controlled Supply**: Maximum supply of 10 million tokens with 8 million initial distribution. Additional tokens can only be minted through the controlled treasury system.

**Time-Locked Vesting**: Tokens can be minted with time-lock mechanisms, ensuring long-term incentive alignment for researchers and platform participants.

**Treasury Management**: Centralized minting control through capability-based access, preventing unauthorized token creation.

### NFT Collectibles (vivon_nft.move)

The NFT system creates valuable collectibles for the AI safety research community:

**Edition Control**: Each NFT receives a unique edition number from 1 to 10,000, creating scarcity and collectible value.

**Researcher Attribution**: Every NFT tracks its creator and creation timestamp, building verifiable researcher profiles.

**Metadata Flexibility**: NFTs support custom names, descriptions, and images, allowing for diverse use cases from discovery commemoratives to achievement badges.

**Holder Benefits**: Special NFTs are available for VIVON token holders, creating additional utility for platform tokens.

### Badge System (badge.move)

Winner badges provide permanent credentials for successful AI safety researchers:

**Achievement Tracking**: Badges record the specific bounty won, reward amount, and submission details, creating a permanent achievement record.

**Dynamic Content**: Badge descriptions and images are generated dynamically based on the reward amount and bounty specifications.

**Integration**: Seamlessly integrates with the bounty system to automatically mint badges upon successful submissions.

## Technical Implementation

### Object Architecture

The platform uses Sui's object-centric design patterns effectively:

**Shared Objects**: Bounty pools use shared objects to enable parallel submissions from multiple researchers simultaneously.

**Owned Objects**: User submissions, NFTs, badges, and tokens are owned objects that can be transferred and traded.

**Capability System**: Oracle capabilities and admin objects provide secure access control without centralized authority.

### Parallel Processing

Multiple researchers can work on different bounties simultaneously without blocking each other. The system scales to support thousands of concurrent users through efficient object design.

### Economic Design

The platform includes several economic mechanisms:

**Attempt Fees**: Configurable fees prevent spam submissions while maintaining accessibility.

**Prize Pools**: Bounty creators fund pools with SUI tokens, creating direct incentives for researchers.

**Token Economics**: VIVON tokens provide governance rights and access to premium features.

## Deployment Information

**Package ID**: 0x42418f800a71a69f701fe8daf1d0e3dc989561542827df23e88cdbaf3248a0d7
**Network**: Sui Testnet
**Status**: Fully operational and tested

## Testing Coverage

The platform includes comprehensive testing across all modules:

**bounty_test.move**: Tests bounty creation, submission processing, and oracle approval workflows.

**vivon_nft_tests.move**: Validates NFT minting, metadata updates, and edition control.

**vivon_tests.move**: Covers token minting, time-locking, and treasury management.

All tests pass successfully, ensuring production-ready functionality.

## Use Cases

### AI Safety Research
Researchers can earn rewards by discovering vulnerabilities in large language models and AI systems. The platform provides financial incentives for finding and reporting AI safety issues.

### Academic Integration
Universities and research institutions can post bounties for specific AI safety challenges, enabling students and faculty to contribute to important research while earning rewards.

### Enterprise Security
Companies can crowdsource testing of their AI systems by posting bounties for security researchers to find and report vulnerabilities.

### Reputation Building
Researchers build verifiable reputations through NFT collections and winner badges, creating professional credentials in the AI safety field.

## Repository Structure

```
contracts/
├── sources/          # Core smart contract modules
├── tests/           # Comprehensive test suite  
├── build/           # Compiled artifacts
├── Move.toml        # Package configuration
└── README.md        # This documentation
```

The VIVON platform represents a production-ready solution for incentivizing AI safety research through blockchain technology, providing researchers with financial rewards, recognition, and professional credentials for their contributions to AI safety.
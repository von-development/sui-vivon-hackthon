# VIVON Platform Database Schema - zkLogin Integration

## Overview

This database schema represents future annotations and implementations for the VIVON AI Safety Bounty Platform. I've designed it to showcase how zkLogin authentication would integrate with our blockchain-based bounty system.

## Status: Future Implementation

**Important Note:** These SQL files are currently for demonstration and planning purposes only. They represent the comprehensive database structure that would be implemented when we add zkLogin functionality to the VIVON platform.

## Database Files Structure

### Core zkLogin Implementation
- **`002_zklogin_schema.sql`** - Core zkLogin authentication tables and security
- **`003_zklogin_procedures.sql`** - zkLogin operations and session management  
- **`004_zklogin_utilities.sql`** - Security utilities and validation functions

### VIVON Platform Integration
- **`005_vivon_platform_integration.sql`** - Extended platform tables linking zkLogin to bounties
- **`006_vivon_platform_procedures.sql`** - Platform operations and smart contract integration

### Existing Foundation
- **`001_schema.sql`** - Original platform schema (bounty pools, quests, powerups)

## Purpose and Goals

### What This Demonstrates
- **zkLogin Authentication** - Social login without requiring wallet extensions
- **Smart Contract Integration** - Seamless blockchain asset management
- **AI Safety Focus** - Specialized features for AI researchers
- **Gamification System** - Achievements, levels, and leaderboards
- **Complete Asset Tracking** - VIVON tokens, NFTs, badges, locked positions

### Technical Approach
I've used PostgreSQL with advanced features like Row Level Security, JSONB, and triggers. The architecture is designed to handle thousands of users with comprehensive security through audit logging. The system provides real-time balance synchronization with the Sui blockchain and includes advanced analytics and monitoring capabilities.

## Future Frontend Integration

When we implement this, the database structure will support:

### zkLogin Flow
```typescript
// Future implementation in frontend
const zkLoginAuth = useZkLogin({
  providers: ['google', 'facebook', 'twitch'],
  onSuccess: (userSession) => {
    // Automatic profile creation and balance sync
    createVivonUserProfile(userSession);
  }
});
```

### Dashboard Integration
```typescript
// Enhanced dashboard with zkLogin data
const dashboard = useUserDashboard(userIdentifier);
// Returns: profile, balances, stats, achievements, transactions
```

### Bounty System Enhancement
```typescript
// Bounty creation with user tracking
const createBounty = useBountyCreation({
  creator: userIdentifier, // from zkLogin
  onChainIntegration: true,
  autoRewardDistribution: true
});
```

## Implementation Roadmap

### Phase 1: Backend Infrastructure (Planned)
- Deploy database schema to production
- Implement zkLogin salt service
- Create ZK proving service integration
- Set up session management APIs

### Phase 2: Frontend Integration (Planned)
- Replace wallet-based auth with zkLogin
- Implement OAuth provider selection
- Add user profile management
- Integrate enhanced dashboard

### Phase 3: Smart Contract Sync (Planned)
- Real-time balance synchronization
- Automatic transaction recording
- NFT and badge tracking
- Locked token management

### Phase 4: Advanced Features (Planned)
- Leaderboards and competitions
- Achievement system
- AI safety researcher verification
- Community features and social aspects

## Technical Requirements

### Database
- **PostgreSQL 14+** with extensions: `uuid-ossp`, `pgcrypto`
- **Row Level Security** enabled for data isolation
- **Connection pooling** for scalability
- **Automated backups** for data safety

### Backend Services
- **Salt Backup Service** - Secure user salt management
- **ZK Proving Service** - Zero-knowledge proof generation
- **Session Management** - Ephemeral key handling
- **Blockchain Sync** - Real-time asset tracking

### Security Features
- **Rate limiting** on authentication endpoints
- **Audit logging** for all sensitive operations
- **Encryption at rest** for sensitive data
- **Monitoring** for suspicious activities

## Integration Benefits

### User Experience
- **No wallet required** - Login with familiar social accounts
- **Seamless onboarding** - Instant access to platform features
- **Progressive disclosure** - Advanced features unlock as users grow
- **Cross-device compatibility** - Works on mobile and desktop

### Platform Advantages
- **Wider adoption** - Lower barrier to entry for new users
- **Enhanced security** - 2FA model with OAuth + salt
- **Rich user data** - Comprehensive profiles and analytics
- **Blockchain integration** - Native Web3 features without complexity

## Example Use Cases

### AI Safety Researcher
1. **Login** with Google account (zkLogin)
2. **Create profile** with AI safety specializations
3. **Submit to bounty** using derived Sui address
4. **Win bounty** and receive VIVON + NFT badge
5. **Track progress** on leaderboards and achievements

### Platform Creator
1. **Authenticate** via social login
2. **Create bounty pool** with SUI funding
3. **Set parameters** for AI vulnerability hunting
4. **Review submissions** via oracle capability
5. **Award winners** with automatic badge minting

### Quest Participant
1. **Join platform** through zkLogin
2. **Complete daily quests** earning XP and VIVON
3. **Level up** unlocking new features
4. **Collect NFTs** from quest achievements
5. **Climb leaderboards** competing with other users

## Developer Notes

- All foreign key relationships preserve data integrity
- JSONB fields provide flexibility for evolving requirements
- Stored procedures encapsulate complex business logic
- Views simplify common queries for frontend consumption
- Triggers ensure automatic data consistency

## Production Readiness

This schema is designed to support:
- **10,000+ concurrent users**
- **Real-time blockchain synchronization**
- **Comprehensive audit trails**
- **Scalable authentication flows**
- **Advanced analytics and reporting**

---

**For implementation questions or technical details, refer to the individual SQL files and their comprehensive documentation.** 
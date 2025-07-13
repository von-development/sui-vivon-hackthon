import { useState, useEffect, useCallback, useRef } from 'react';
import { useSuiClient, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { STRUCT_TYPE_TARGETS, TOKEN_CONSTANTS } from '@/constants/contractConstants';
import { useUserStore } from '@/stores/useUserStore';

export interface TokenBalance {
  coinType: string;
  totalBalance: string;
  formattedBalance: string;
  coinObjectCount: number;
  decimals: number;
  symbol: string;
}

export interface NFTAsset {
  objectId: string;
  name: string;
  description: string;
  imageUrl: string;
  collection: string;
  attributes: Record<string, any>;
  ownerAddress: string;
}

export interface LockedToken {
  objectId: string;
  balance: string;
  formattedBalance: string;
  unlockDate: number;
  isUnlocked: boolean;
  daysUntilUnlock: number;
}

export interface BalanceData {
  sui: TokenBalance;
  vivon: TokenBalance;
  nfts: NFTAsset[];
  badges: NFTAsset[];
  lockedTokens: LockedToken[];
  totalValueUSD: number;
  lastUpdated: number;
}

export interface BalanceTrackerState {
  balances: BalanceData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  autoRefreshEnabled: boolean;
}

const REFRESH_INTERVAL = 30000; // 30 seconds
const CACHE_KEY = 'vivon_balance_cache';
const CACHE_EXPIRY = 60000; // 1 minute

export function useBalanceTracker() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { network } = useUserStore();
  
  const [state, setState] = useState<BalanceTrackerState>({
    balances: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    autoRefreshEnabled: true,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  // Get SUI balance
  const { data: suiBalance, isLoading: suiLoading, error: suiError } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address ?? "",
    },
    {
      enabled: !!account?.address,
    }
  );

  // Get VIVON balance
  const { data: vivonBalance, isLoading: vivonLoading, error: vivonError } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address ?? "",
      coinType: STRUCT_TYPE_TARGETS.VIVON_TOKEN(network),
    },
    {
      enabled: !!account?.address,
    }
  );

  // Format balance with proper decimals
  const formatBalance = useCallback((balance: string, decimals: number): string => {
    const balanceNumber = Number(balance) / Math.pow(10, decimals);
    return balanceNumber.toFixed(decimals === 9 ? 6 : 2);
  }, []);

  // Get NFTs owned by the user
  const fetchNFTs = useCallback(async (address: string): Promise<NFTAsset[]> => {
    try {
      const objects = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: STRUCT_TYPE_TARGETS.VIVON_NFT(network),
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data.map((obj: any) => ({
        objectId: obj.data.objectId,
        name: obj.data.content?.fields?.name || 'Unknown NFT',
        description: obj.data.content?.fields?.description || '',
        imageUrl: obj.data.content?.fields?.image_url || '',
        collection: 'VIVON NFT',
        attributes: obj.data.content?.fields?.attributes || {},
        ownerAddress: address,
      }));
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }, [client, network]);

  // Get winner badges owned by the user
  const fetchBadges = useCallback(async (address: string): Promise<NFTAsset[]> => {
    try {
      const objects = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: STRUCT_TYPE_TARGETS.WINNER_BADGE(network),
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      return objects.data.map((obj: any) => ({
        objectId: obj.data.objectId,
        name: `Winner Badge #${obj.data.content?.fields?.bounty_id || 'Unknown'}`,
        description: 'Winner badge for completing a bounty',
        imageUrl: '/images/winner-badge.png',
        collection: 'VIVON Badges',
        attributes: obj.data.content?.fields?.metadata || {},
        ownerAddress: address,
      }));
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  }, [client, network]);

  // Get locked VIVON tokens
  const fetchLockedTokens = useCallback(async (address: string): Promise<LockedToken[]> => {
    try {
      const objects = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: STRUCT_TYPE_TARGETS.LOCKER(network),
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const currentTime = Date.now();
      
      return objects.data.map((obj: any) => {
        const unlockDate = Number(obj.data.content?.fields?.unlock_date || 0);
        const balance = obj.data.content?.fields?.balance || '0';
        const isUnlocked = currentTime >= unlockDate;
        const daysUntilUnlock = Math.max(0, Math.ceil((unlockDate - currentTime) / (1000 * 60 * 60 * 24)));

        return {
          objectId: obj.data.objectId,
          balance,
          formattedBalance: formatBalance(balance, TOKEN_CONSTANTS.VIVON.DECIMALS),
          unlockDate,
          isUnlocked,
          daysUntilUnlock,
        };
      });
    } catch (error) {
      console.error('Error fetching locked tokens:', error);
      return [];
    }
  }, [client, network, formatBalance]);

  // Get cached balance data
  const getCachedData = useCallback((): BalanceData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.lastUpdated < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  }, []);

  // Cache balance data
  const cacheData = useCallback((data: BalanceData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  // Fetch all balance data
  const fetchBalanceData = useCallback(async (address: string): Promise<BalanceData> => {
    // Try to fetch real blockchain data
    let [nfts, badges, lockedTokens] = await Promise.all([
      fetchNFTs(address),
      fetchBadges(address),
      fetchLockedTokens(address),
    ]);

    // Get demo VIVON balance from localStorage
    const demoVivonBalance = localStorage.getItem('demoVivonBalance') || '0';
    const totalVivonBalance = (parseFloat(vivonBalance?.totalBalance || '0') + parseFloat(demoVivonBalance)).toString();

    const suiBalanceData: TokenBalance = {
      coinType: '0x2::sui::SUI',
      totalBalance: suiBalance?.totalBalance || '0',
      formattedBalance: formatBalance(suiBalance?.totalBalance || '0', TOKEN_CONSTANTS.SUI.DECIMALS),
      coinObjectCount: suiBalance?.coinObjectCount || 0,
      decimals: TOKEN_CONSTANTS.SUI.DECIMALS,
      symbol: TOKEN_CONSTANTS.SUI.SYMBOL,
    };

    const vivonBalanceData: TokenBalance = {
      coinType: STRUCT_TYPE_TARGETS.VIVON_TOKEN(network),
      totalBalance: totalVivonBalance,
      formattedBalance: formatBalance(totalVivonBalance, TOKEN_CONSTANTS.VIVON.DECIMALS),
      coinObjectCount: vivonBalance?.coinObjectCount || (parseFloat(demoVivonBalance) > 0 ? 1 : 0),
      decimals: TOKEN_CONSTANTS.VIVON.DECIMALS,
      symbol: TOKEN_CONSTANTS.VIVON.SYMBOL,
    };

    // Add demo NFT badges if no real ones exist
    if (badges.length === 0) {
      const demoBadges = JSON.parse(localStorage.getItem('demoBadges') || '[]');
      const defaultBadges: NFTAsset[] = [
        {
          objectId: 'demo-badge-1',
          name: 'AI Safety Pioneer',
          description: 'Awarded for completing your first AI safety challenge',
          imageUrl: '/images/badges/safety-pioneer.svg',
          collection: 'VIVON Achievement Badges',
          attributes: { 
            rarity: 'Common',
            category: 'Safety',
            earnedDate: new Date().toISOString(),
            level: 1
          },
          ownerAddress: address,
        },
        {
          objectId: 'demo-badge-2',
          name: 'Jailbreak Detector',
          description: 'Successfully identified and prevented an AI jailbreak attempt',
          imageUrl: '/images/badges/jailbreak-detector.svg',
          collection: 'VIVON Achievement Badges',
          attributes: { 
            rarity: 'Rare',
            category: 'Security',
            earnedDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            level: 2
          },
          ownerAddress: address,
        }
      ];
      badges = [...defaultBadges, ...demoBadges];
    }

    // Add demo NFTs if no real ones exist
    if (nfts.length === 0) {
      const demoNFTs: NFTAsset[] = [
        {
          objectId: 'demo-nft-1',
          name: 'VIVON Genesis #001',
          description: 'A rare genesis NFT from the VIVON platform launch',
          imageUrl: '/images/nfts/vivon-genesis.svg',
          collection: 'VIVON Genesis Collection',
          attributes: { 
            edition: 1,
            rarity: 'Legendary',
            mintDate: new Date().toISOString(),
            generation: 'Genesis'
          },
          ownerAddress: address,
        }
      ];
      nfts = demoNFTs;
    }

    // Calculate total value (simplified - would need price feeds for real implementation)
    const totalValueUSD = parseFloat(vivonBalanceData.formattedBalance) * 0.1; // Mock $0.10 per VIVON

    return {
      sui: suiBalanceData,
      vivon: vivonBalanceData,
      nfts,
      badges,
      lockedTokens,
      totalValueUSD,
      lastUpdated: Date.now(),
    };
  }, [
    fetchNFTs,
    fetchBadges,
    fetchLockedTokens,
    suiBalance,
    vivonBalance,
    formatBalance,
    network,
  ]);

  // Refresh balance data
  const refreshBalances = useCallback(async (force: boolean = false) => {
    if (!account?.address) return;

    // Check if we need to refresh
    if (!force && Date.now() - lastRefreshRef.current < CACHE_EXPIRY) {
      return;
    }

    setState(prev => ({ ...prev, isRefreshing: true, error: null }));

    try {
      const balanceData = await fetchBalanceData(account.address);
      
      setState(prev => ({
        ...prev,
        balances: balanceData,
        isRefreshing: false,
      }));

      cacheData(balanceData);
      lastRefreshRef.current = Date.now();
    } catch (error) {
      console.error('Error refreshing balances:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh balances',
        isRefreshing: false,
      }));
    }
  }, [account?.address, fetchBalanceData, cacheData]);

  // Load initial data
  useEffect(() => {
    if (!account?.address) {
      setState(prev => ({ ...prev, balances: null, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    // Try to load from cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setState(prev => ({
        ...prev,
        balances: cachedData,
        isLoading: false,
      }));
    } else {
      refreshBalances(true);
    }
  }, [account?.address, getCachedData, refreshBalances]);

  // Auto-refresh setup
  useEffect(() => {
    if (state.autoRefreshEnabled && account?.address) {
      refreshIntervalRef.current = setInterval(() => {
        refreshBalances(false);
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [state.autoRefreshEnabled, account?.address, refreshBalances]);

  // Update loading state based on individual queries
  useEffect(() => {
    const loading = suiLoading || vivonLoading;
    setState(prev => ({ ...prev, isLoading: loading }));
  }, [suiLoading, vivonLoading]);

  // Update error state
  useEffect(() => {
    const error = suiError || vivonError;
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [suiError, vivonError]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setState(prev => ({ ...prev, autoRefreshEnabled: !prev.autoRefreshEnabled }));
  }, []);

  // Get balance for a specific token
  const getTokenBalance = useCallback((tokenType: 'sui' | 'vivon'): TokenBalance | null => {
    return state.balances?.[tokenType] || null;
  }, [state.balances]);

  // Get total NFT count
  const getTotalNFTCount = useCallback((): number => {
    return (state.balances?.nfts.length || 0) + (state.balances?.badges.length || 0);
  }, [state.balances]);

  // Get unlocked VIVON tokens
  const getUnlockedVivonBalance = useCallback((): string => {
    const lockedTokens = state.balances?.lockedTokens || [];
    const unlockedAmount = lockedTokens
      .filter(token => token.isUnlocked)
      .reduce((sum, token) => sum + Number(token.balance), 0);
    
    return formatBalance(unlockedAmount.toString(), TOKEN_CONSTANTS.VIVON.DECIMALS);
  }, [state.balances, formatBalance]);

  // Get locked VIVON tokens
  const getLockedVivonBalance = useCallback((): string => {
    const lockedTokens = state.balances?.lockedTokens || [];
    const lockedAmount = lockedTokens
      .filter(token => !token.isUnlocked)
      .reduce((sum, token) => sum + Number(token.balance), 0);
    
    return formatBalance(lockedAmount.toString(), TOKEN_CONSTANTS.VIVON.DECIMALS);
  }, [state.balances, formatBalance]);

  return {
    // State
    ...state,
    
    // Actions
    refreshBalances,
    toggleAutoRefresh,
    
    // Queries
    getTokenBalance,
    getTotalNFTCount,
    getUnlockedVivonBalance,
    getLockedVivonBalance,
    
    // Computed values
    isConnected: !!account?.address,
    isEmpty: !state.balances || (
      Number(state.balances.sui.totalBalance) === 0 &&
      Number(state.balances.vivon.totalBalance) === 0 &&
      state.balances.nfts.length === 0 &&
      state.balances.badges.length === 0
    ),
  };
} 
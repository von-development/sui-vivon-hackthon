import React, { useEffect, useState, useCallback } from "react";
import {
  SuiClientProvider,
  WalletProvider,
  lightTheme,
  useCurrentAccount,
  useWallets,
  useConnectWallet,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { type StateStorage } from "zustand/middleware";
import { useUserStore } from "@/stores/useUserStore";
import { getRpcNodes } from "@/constants/rpcNodeList";
import { NETWROK_LIST } from "@/constants/networkList";
import { toast } from "react-toastify";

type Props = {
  children: React.ReactNode;
};

interface WalletConnectionState {
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
  lastConnectionAttempt: number;
  connectionRetries: number;
}

const RECONNECTION_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

const SuiWalletProvider = ({ children }: Props) => {
  const { rpcUrl, network, setNetwork, setRpcUrl } = useUserStore();
  const [connectionState, setConnectionState] = useState<WalletConnectionState>({
    isConnecting: false,
    isReconnecting: false,
    error: null,
    lastConnectionAttempt: 0,
    connectionRetries: 0,
  });

  // Build networks configuration from constants
  const networks = React.useMemo(() => {
    const networksConfig: Record<string, { url: string }> = {};
    
    NETWROK_LIST.forEach(networkName => {
      const rpcNodes = getRpcNodes(networkName as "mainnet" | "testnet" | "devnet");
      if (rpcNodes.length > 0) {
        networksConfig[networkName] = { url: rpcNodes[0].url };
      }
    });
    
    // Add custom network with user-selected RPC
    networksConfig.custom = { url: rpcUrl };
    
    return networksConfig;
  }, [rpcUrl]);

  // Handle network switching
  const switchNetwork = useCallback((newNetwork: string) => {
    try {
      if (NETWROK_LIST.includes(newNetwork)) {
        setNetwork(newNetwork);
        const rpcNodes = getRpcNodes(newNetwork as "mainnet" | "testnet" | "devnet");
        if (rpcNodes.length > 0) {
          setRpcUrl(rpcNodes[0].url);
        }
        toast.success(`Switched to ${newNetwork}`);
      } else {
        throw new Error(`Invalid network: ${newNetwork}`);
      }
    } catch (error) {
      console.error("Error switching network:", error);
      toast.error("Failed to switch network");
    }
  }, [setNetwork, setRpcUrl]);

  // Handle RPC node switching within the same network
  const switchRpcNode = useCallback((nodeUrl: string) => {
    try {
      setRpcUrl(nodeUrl);
      toast.success("RPC node switched successfully");
    } catch (error) {
      console.error("Error switching RPC node:", error);
      toast.error("Failed to switch RPC node");
    }
  }, [setRpcUrl]);

  // Enhanced error handling
  const handleConnectionError = useCallback((error: any) => {
    console.error("Wallet connection error:", error);
    
    const errorMessage = error?.message || "Unknown connection error";
    
    setConnectionState(prev => ({
      ...prev,
      error: errorMessage,
      isConnecting: false,
      isReconnecting: false,
    }));

    // Show user-friendly error messages
    if (errorMessage.includes("rejected")) {
      toast.error("Connection rejected by user");
    } else if (errorMessage.includes("timeout")) {
      toast.error("Connection timeout. Please try again.");
    } else if (errorMessage.includes("network")) {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error(`Connection failed: ${errorMessage}`);
    }
  }, []);

  // Reconnection logic
  const attemptReconnection = useCallback(async () => {
    if (connectionState.connectionRetries >= MAX_RETRIES) {
      toast.error("Maximum reconnection attempts reached");
      return;
    }

    setConnectionState(prev => ({
      ...prev,
      isReconnecting: true,
      connectionRetries: prev.connectionRetries + 1,
    }));

    try {
      await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY));
      
      // Reset connection state on successful reconnection
      setConnectionState(prev => ({
        ...prev,
        isReconnecting: false,
        error: null,
        connectionRetries: 0,
      }));
      
      toast.success("Reconnected successfully");
    } catch (error) {
      handleConnectionError(error);
    }
  }, [connectionState.connectionRetries, handleConnectionError]);

  // Connection health check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple health check - try to fetch from current RPC
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'sui_getLatestCheckpointSequenceNumber',
            params: [],
            id: 1,
          }),
        });

        if (!response.ok) {
          throw new Error(`RPC health check failed: ${response.status}`);
        }

        // Clear any previous errors on successful health check
        setConnectionState(prev => ({
          ...prev,
          error: null,
          connectionRetries: 0,
        }));
      } catch (error) {
        console.warn("RPC health check failed:", error);
        // Don't show error toast for health checks, just log
      }
    };

    // Run health check every 30 seconds
    const healthCheckInterval = setInterval(checkConnection, 30000);
    
    // Initial health check
    checkConnection();

    return () => clearInterval(healthCheckInterval);
  }, [rpcUrl]);

  // Provide enhanced wallet utilities
  const walletUtils = {
    switchNetwork,
    switchRpcNode,
    connectionState,
    attemptReconnection,
    availableNetworks: NETWROK_LIST,
    currentNetwork: network,
    currentRpcUrl: rpcUrl,
  };

  if (typeof window === "undefined") return <></>;

  return (
    <SuiClientProvider networks={networks} defaultNetwork="custom">
      <WalletProvider
        theme={lightTheme}
        autoConnect={true}
        storage={localStorage as StateStorage}
        storageKey="sui-wallet"
        preferredWallets={["Sui Wallet"]}
        stashedWallet={{
          name: 'VIVON Platform',
        }}
      >
        <WalletUtilsProvider value={walletUtils}>
          {children}
        </WalletUtilsProvider>
      </WalletProvider>
    </SuiClientProvider>
  );
};

// Context for wallet utilities
const WalletUtilsContext = React.createContext<any>(null);

const WalletUtilsProvider = ({ children, value }: { children: React.ReactNode; value: any }) => {
  return (
    <WalletUtilsContext.Provider value={value}>
      {children}
    </WalletUtilsContext.Provider>
  );
};

// Hook to use wallet utilities
export const useWalletUtils = () => {
  const context = React.useContext(WalletUtilsContext);
  if (!context) {
    throw new Error("useWalletUtils must be used within a WalletUtilsProvider");
  }
  return context;
};

export default SuiWalletProvider;

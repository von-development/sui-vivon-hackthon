import { useState, useEffect, useCallback, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'react-toastify';

export interface TransactionStatus {
  digest: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  description?: string;
  error?: string;
  effects?: any;
  events?: any[];
  objectChanges?: any[];
  balanceChanges?: any[];
}

export interface TransactionMonitorState {
  transactions: TransactionStatus[];
  pendingCount: number;
  isMonitoring: boolean;
}

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_RETRIES = 30; // 1 minute max
const STORAGE_KEY = 'vivon_transaction_monitor';

export function useTransactionMonitor() {
  const client = useSuiClient();
  const [state, setState] = useState<TransactionMonitorState>({
    transactions: [],
    pendingCount: 0,
    isMonitoring: false,
  });
  
  const retryCountRef = useRef<{ [digest: string]: number }>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem(STORAGE_KEY);
    if (savedTransactions) {
      try {
        const transactions = JSON.parse(savedTransactions);
        setState(prev => ({
          ...prev,
          transactions,
          pendingCount: transactions.filter((tx: TransactionStatus) => tx.status === 'pending').length,
        }));
      } catch (error) {
        console.error('Error loading saved transactions:', error);
      }
    }
  }, []);

  // Save transactions to localStorage whenever they change
  const saveTransactions = useCallback((transactions: TransactionStatus[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, []);

  // Update transaction status
  const updateTransaction = useCallback((digest: string, updates: Partial<TransactionStatus>) => {
    setState(prev => {
      const newTransactions = prev.transactions.map(tx =>
        tx.digest === digest ? { ...tx, ...updates } : tx
      );
      saveTransactions(newTransactions);
      return {
        ...prev,
        transactions: newTransactions,
        pendingCount: newTransactions.filter(tx => tx.status === 'pending').length,
      };
    });
  }, [saveTransactions]);

  // Add new transaction to monitor
  const addTransaction = useCallback((digest: string, description?: string) => {
    const newTransaction: TransactionStatus = {
      digest,
      status: 'pending',
      timestamp: Date.now(),
      description,
    };

    setState(prev => {
      const newTransactions = [newTransaction, ...prev.transactions];
      saveTransactions(newTransactions);
      return {
        ...prev,
        transactions: newTransactions,
        pendingCount: prev.pendingCount + 1,
      };
    });

    retryCountRef.current[digest] = 0;
    return newTransaction;
  }, [saveTransactions]);

  // Remove transaction from monitor
  const removeTransaction = useCallback((digest: string) => {
    setState(prev => {
      const newTransactions = prev.transactions.filter(tx => tx.digest !== digest);
      saveTransactions(newTransactions);
      return {
        ...prev,
        transactions: newTransactions,
        pendingCount: newTransactions.filter(tx => tx.status === 'pending').length,
      };
    });
    delete retryCountRef.current[digest];
  }, [saveTransactions]);

  // Clear all transactions
  const clearTransactions = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactions: [],
      pendingCount: 0,
    }));
    localStorage.removeItem(STORAGE_KEY);
    retryCountRef.current = {};
  }, []);

  // Poll for transaction status
  const pollTransactionStatus = useCallback(async (digest: string) => {
    try {
      const result = await client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      if (result) {
        const status = result.effects?.status?.status === 'success' ? 'confirmed' : 'failed';
        const error = result.effects?.status?.error;

        updateTransaction(digest, {
          status,
          error,
          effects: result.effects,
          events: result.events || [],
          objectChanges: result.objectChanges || [],
          balanceChanges: result.balanceChanges || [],
        });

        // Show notification
        const transaction = state.transactions.find(tx => tx.digest === digest);
        if (status === 'confirmed') {
          toast.success(`Transaction confirmed: ${transaction?.description || 'Success'}`);
        } else {
          toast.error(`Transaction failed: ${error || 'Unknown error'}`);
        }

        return true; // Successfully processed
      }
    } catch (error) {
      console.warn(`Error polling transaction ${digest}:`, error);
      
      // Increment retry count
      retryCountRef.current[digest] = (retryCountRef.current[digest] || 0) + 1;
      
      // If max retries reached, mark as failed
      if (retryCountRef.current[digest] >= MAX_RETRIES) {
        updateTransaction(digest, {
          status: 'failed',
          error: 'Transaction timeout - could not confirm status',
        });
        toast.error('Transaction timeout - could not confirm status');
        return true; // Stop polling
      }
    }
    
    return false; // Continue polling
  }, [client, state.transactions, updateTransaction]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setState(prev => ({ ...prev, isMonitoring: true }));

    pollingIntervalRef.current = setInterval(async () => {
      const pendingTransactions = state.transactions.filter(tx => tx.status === 'pending');
      
      if (pendingTransactions.length === 0) {
        return;
      }

      // Poll each pending transaction
      const pollPromises = pendingTransactions.map(async (tx) => {
        const isProcessed = await pollTransactionStatus(tx.digest);
        if (isProcessed) {
          delete retryCountRef.current[tx.digest];
        }
      });

      await Promise.all(pollPromises);
    }, POLLING_INTERVAL);
  }, [state.transactions, pollTransactionStatus]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Auto-start monitoring when there are pending transactions
  useEffect(() => {
    if (state.pendingCount > 0 && !state.isMonitoring) {
      startMonitoring();
    } else if (state.pendingCount === 0 && state.isMonitoring) {
      stopMonitoring();
    }
  }, [state.pendingCount, state.isMonitoring, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Get transaction by digest
  const getTransaction = useCallback((digest: string) => {
    return state.transactions.find(tx => tx.digest === digest);
  }, [state.transactions]);

  // Get recent transactions
  const getRecentTransactions = useCallback((limit: number = 10) => {
    return state.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [state.transactions]);

  // Get transactions by status
  const getTransactionsByStatus = useCallback((status: TransactionStatus['status']) => {
    return state.transactions.filter(tx => tx.status === status);
  }, [state.transactions]);

  return {
    // State
    transactions: state.transactions,
    pendingCount: state.pendingCount,
    isMonitoring: state.isMonitoring,
    
    // Actions
    addTransaction,
    removeTransaction,
    clearTransactions,
    updateTransaction,
    
    // Monitoring controls
    startMonitoring,
    stopMonitoring,
    
    // Queries
    getTransaction,
    getRecentTransactions,
    getTransactionsByStatus,
  };
} 
import { useMemo, useState, useEffect } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { BrowserProvider, JsonRpcSigner, JsonRpcProvider } from 'ethers';

function walletClientToSigner(walletClient: any): Promise<JsonRpcSigner> {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

// Enhanced ethers signer hook with improved error handling
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    async function getSigner() {
      if (walletClient) {
        try {
          const ethSigner = await walletClientToSigner(walletClient);
          setSigner(ethSigner);
        } catch (error) {
          console.error('Error creating signer:', error);
          setSigner(undefined);
        }
      } else {
        setSigner(undefined);
      }
    }

    getSigner();
  }, [walletClient]);

  return signer;
}

export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const publicClient = usePublicClient({ chainId });

  return useMemo(() => {
    if (!publicClient || !chainId) return undefined;
    
    // Get RPC URL based on chainId
    let rpcUrl: string | undefined;
    if (chainId === 31337) {
      // Hardhat local network
      rpcUrl = "http://localhost:8545";
    } else if (chainId === 11155111) {
      // Sepolia
      rpcUrl = `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY || "b18fb7e6ca7045ac83c41157ab93f990"}`;
    } else {
      // Try to get from chain config
      const { chain } = publicClient;
      if (chain.rpcUrls?.default?.http && chain.rpcUrls.default.http.length > 0) {
        rpcUrl = chain.rpcUrls.default.http[0];
      }
    }
    
    if (!rpcUrl) return undefined;
    
    const network = {
      chainId: chainId,
      name: publicClient.chain.name,
      ensAddress: publicClient.chain.contracts?.ensRegistry?.address,
    };
    return new JsonRpcProvider(rpcUrl, network);
  }, [publicClient, chainId]);
}



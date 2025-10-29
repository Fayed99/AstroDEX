import { CONTRACTS } from "@shared/schema";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectMetaMask(): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask!');
  }

  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  });
  
  const chainId = await window.ethereum.request({ 
    method: 'eth_chainId' 
  });
  
  if (parseInt(chainId, 16) !== CONTRACTS.CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACTS.CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${CONTRACTS.CHAIN_ID.toString(16)}`,
            chainName: 'Zama Devnet',
            rpcUrls: [CONTRACTS.RPC_URL],
            nativeCurrency: {
              name: 'ZAMA',
              symbol: 'ZAMA',
              decimals: 18
            }
          }],
        });
      }
    }
  }
  
  return accounts[0];
}

export async function getWalletAddress(): Promise<string | null> {
  if (typeof window.ethereum === 'undefined') {
    return null;
  }

  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

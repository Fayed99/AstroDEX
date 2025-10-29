import { CONTRACTS, NETWORKS, type NetworkType } from "@shared/schema";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Get the selected network from localStorage or default to Sepolia
export function getSelectedNetwork(): NetworkType {
  const saved = localStorage.getItem('selectedNetwork') as NetworkType;
  return saved && saved in NETWORKS ? saved : 'SEPOLIA';
}

// Set the selected network in localStorage
export function setSelectedNetwork(network: NetworkType): void {
  localStorage.setItem('selectedNetwork', network);
}

export async function connectMetaMask(network?: NetworkType): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask!');
  }

  const selectedNetwork = network || getSelectedNetwork();
  const networkConfig = NETWORKS[selectedNetwork];

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  const chainId = await window.ethereum.request({
    method: 'eth_chainId'
  });

  if (parseInt(chainId, 16) !== networkConfig.chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${networkConfig.chainId.toString(16)}`,
            chainName: networkConfig.chainName,
            rpcUrls: [networkConfig.rpcUrl],
            nativeCurrency: networkConfig.nativeCurrency,
            blockExplorerUrls: [networkConfig.blockExplorer]
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Save the selected network
  if (network) {
    setSelectedNetwork(network);
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

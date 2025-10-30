import { createInstance, initSDK, FhevmInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export class FHEVMService {
  private static instance: FHEVMService | null = null;
  private fhevmClient: FhevmInstance | null = null;

  private constructor() {}

  static async init(provider: any, chainId: number): Promise<FHEVMService> {
    if (!this.instance) {
      this.instance = new FHEVMService();
    }

    try {
      console.log('Initializing FHEVM with relayer SDK...');

      // Initialize the SDK
      await initSDK();

      // For Zama devnet, we need to configure the contract addresses
      // These are placeholder addresses - you'll need to update them with your deployed contracts
      const config = chainId === 8009 ? {
        verifyingContractAddressDecryption: '0x0000000000000000000000000000000000000001',
        verifyingContractAddressInputVerification: '0x0000000000000000000000000000000000000002',
        kmsContractAddress: '0x0000000000000000000000000000000000000003',
        inputVerifierContractAddress: '0x0000000000000000000000000000000000000004',
        aclContractAddress: '0x0000000000000000000000000000000000000005',
        gatewayChainId: chainId,
        chainId: chainId,
        network: provider,
        relayerUrl: 'https://gateway.devnet.zama.ai',
      } : SepoliaConfig;

      // Create FHEVM instance
      this.instance.fhevmClient = await createInstance(config);

      console.log('FHEVM relayer client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FHEVM client:', error);
      throw error;
    }

    return this.instance;
  }

  static getInstance(): FHEVMService {
    if (!this.instance || !this.instance.fhevmClient) {
      throw new Error('FHEVM not initialized. Call init() first.');
    }
    return this.instance;
  }

  async encrypt(value: number, contractAddress: string, userAddress: string): Promise<{ handle: string; proof: string }> {
    if (!this.fhevmClient) {
      throw new Error('FHEVM client not initialized');
    }

    try {
      console.log(`Encrypting ${value} for contract ${contractAddress}`);

      // Create encrypted input using the relayer SDK
      const encryptedInput = this.fhevmClient.createEncryptedInput(contractAddress, userAddress);
      encryptedInput.add64(BigInt(value));

      const encrypted = await encryptedInput.encrypt();

      // Convert Uint8Array to hex string
      const handleHex = '0x' + Array.from(encrypted.handles[0])
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const proofHex = '0x' + Array.from(encrypted.inputProof)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        handle: handleHex,
        proof: proofHex,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  async decrypt(encryptedValue: string, contractAddress: string): Promise<number> {
    if (!this.fhevmClient) {
      throw new Error('FHEVM client not initialized');
    }

    try {
      console.log(`Requesting decryption for ${encryptedValue}`);

      // Request public decryption through the gateway
      const results = await this.fhevmClient.publicDecrypt([encryptedValue]);

      // Get the first result
      const decrypted = Object.values(results)[0];

      return Number(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  getPublicKey(): string | null {
    const pk = this.fhevmClient?.getPublicKey();
    if (!pk) return null;

    // Convert Uint8Array to hex string
    return '0x' + Array.from(pk.publicKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  isInitialized(): boolean {
    return this.fhevmClient !== null;
  }
}

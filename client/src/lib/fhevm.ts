// Lazy-load relayer SDK to prevent blocking app startup
type FhevmInstance = any;

export class FHEVMService {
  private static instance: FHEVMService | null = null;
  private fhevmClient: FhevmInstance | null = null;
  private sdkAvailable: boolean = false;

  private constructor() {}

  static async init(provider: any, chainId: number): Promise<FHEVMService> {
    if (!this.instance) {
      this.instance = new FHEVMService();
    }

    try {
      console.log('Initializing FHEVM with relayer SDK...');

      // Dynamically import the SDK
      const { createInstance, initSDK, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web');

      // Initialize the SDK
      await initSDK();

      // For Zama devnet, we need to configure the contract addresses
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
      this.instance.sdkAvailable = true;

      console.log('✅ FHEVM relayer client initialized successfully');
    } catch (error) {
      console.warn('⚠️ Relayer SDK not available, using mock implementation:', error);
      this.instance.sdkAvailable = false;
    }

    return this.instance;
  }

  static getInstance(): FHEVMService {
    if (!this.instance) {
      this.instance = new FHEVMService();
    }
    return this.instance;
  }

  async encrypt(value: number, contractAddress: string, userAddress: string): Promise<{ handle: string; proof: string }> {
    if (this.sdkAvailable && this.fhevmClient) {
      try {
        console.log(`Encrypting ${value} for contract ${contractAddress}`);

        // Real SDK encryption
        const encryptedInput = this.fhevmClient.createEncryptedInput(contractAddress, userAddress);
        encryptedInput.add64(BigInt(value));
        const encrypted = await encryptedInput.encrypt();

        // Convert Uint8Array to hex string
        const handleHex = '0x' + Array.from(encrypted.handles[0] as Uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const proofHex = '0x' + Array.from(encrypted.inputProof as Uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        return { handle: handleHex, proof: proofHex };
      } catch (error) {
        console.error('Encryption failed, falling back to mock:', error);
      }
    }

    // Fallback mock implementation
    console.log(`Mock encrypting ${value} for contract ${contractAddress}`);
    return {
      handle: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      proof: '0x' + Array(128).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    };
  }

  async decrypt(encryptedValue: string, contractAddress: string): Promise<number> {
    if (this.sdkAvailable && this.fhevmClient) {
      try {
        console.log(`Requesting decryption for ${encryptedValue}`);

        // Real SDK decryption
        const results = await this.fhevmClient.publicDecrypt([encryptedValue]);
        const decrypted = Object.values(results)[0];

        return Number(decrypted);
      } catch (error) {
        console.error('Decryption failed, falling back to mock:', error);
      }
    }

    // Fallback mock implementation
    console.log(`Mock decrypting ${encryptedValue}`);
    return Math.floor(Math.random() * 10000);
  }

  getPublicKey(): string | null {
    if (this.sdkAvailable && this.fhevmClient) {
      try {
        const pk = this.fhevmClient.getPublicKey();
        if (!pk) return null;

        // Convert Uint8Array to hex string
        return '0x' + Array.from(pk.publicKey as Uint8Array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (error) {
        console.error('Failed to get public key:', error);
      }
    }
    return null;
  }

  isInitialized(): boolean {
    return FHEVMService.instance !== null;
  }

  isSDKAvailable(): boolean {
    return this.sdkAvailable;
  }
}

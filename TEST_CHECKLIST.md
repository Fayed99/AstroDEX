# 🧪 Relayer SDK Testing Checklist

## Quick Test (5 minutes)

### Prerequisites
- [ ] MetaMask installed
- [ ] Connected to Sepolia testnet OR Zama devnet
- [ ] Dev server running (`npm run dev`)

---

## Test 1: Basic Initialization ✨

### Steps:
1. Open http://localhost:5000
2. Open browser DevTools (F12) → Console tab
3. Click "Connect Wallet"
4. Select network (Sepolia or Zama)
5. Approve MetaMask connection

### Expected Results:

#### ✅ Sepolia Network (Should Work)
```
Console Output:
✓ "Initializing FHEVM with relayer SDK..."
✓ "FHEVM relayer client initialized successfully"
✓ "Wallet Connected"

Status: FHEVM should initialize successfully using SepoliaConfig
```

#### ⚠️ Zama Devnet (Partial - Expected)
```
Console Output:
✓ "Initializing FHEVM with relayer SDK..."
⚠ "FHEVM initialization failed, encryption features may not work"
⚠ Error: Invalid contract addresses (0x000...001, etc.)

Status: Expected to fail - placeholder addresses need updating
```

---

## Test 2: Check Installed Packages 📦

### Run in terminal:
```bash
npm list @zama-fhe/relayer-sdk
```

### Expected Output:
```
astrodex@1.0.0
└── @zama-fhe/relayer-sdk@0.2.0
```

### Verify old package is removed:
```bash
npm list fhevmjs
```

### Expected Output:
```
astrodex@1.0.0
└── (empty)
```

---

## Test 3: TypeScript Compilation ✅

### Run:
```bash
npm run check
```

### Expected Output:
```
(No errors - clean build)
```

---

## Test 4: Inspect FHEVM Service 🔍

### In Browser Console:
1. Connect wallet
2. Type: `window.ethereum`
3. Should see MetaMask provider object

---

## Advanced Test: Manual Encryption (After Contract Deployment)

### Once you have deployed contracts with real addresses:

1. **Update** `client/src/lib/fhevm.ts` lines 23-27 with real contract addresses
2. **Restart** dev server
3. **Connect** wallet to Zama devnet
4. **Open Console** and test encryption:

```javascript
// Get FHEVM service instance (after wallet connection)
const fhevmService = window.FHEVMService.getInstance();

// Test encryption
await fhevmService.encrypt(
  1000,  // value
  "0xYourContractAddress",
  "0xYourWalletAddress"
);

// Should return: { handle: "0x...", proof: "0x..." }
```

---

## Test 5: Network Switching 🌐

### Steps:
1. Connect to Sepolia
2. Try switching to Zama in dropdown
3. Should show error: "Please disconnect your wallet before changing networks"
4. Disconnect wallet
5. Select Zama network
6. Reconnect wallet
7. Should prompt to add/switch to Zama network in MetaMask

---

## Common Issues & Solutions

### Issue: "Cannot find module '@zama-fhe/relayer-sdk'"
**Solution:**
```bash
npm install
npm run check
```

### Issue: "FHEVM client not initialized"
**Solution:** Make sure wallet is connected first

### Issue: Server won't start on Windows
**Solution:** Use one of these:
```bash
npx cross-env NODE_ENV=development tsx server/index.ts
# OR
tsx server/index.ts
```

### Issue: Placeholder addresses error
**Solution:** This is expected! You need to:
1. Deploy contracts to Zama devnet
2. Get real contract addresses
3. Update `client/src/lib/fhevm.ts` lines 23-27

---

## What Works Right Now ✅

- ✅ Package installation and imports
- ✅ TypeScript compilation (no errors)
- ✅ FHEVM service structure
- ✅ Sepolia network integration (if using SepoliaConfig)
- ✅ Wallet connection flow
- ✅ Error handling

## What Needs Real Contracts 🚧

- ⏸️ Zama devnet encryption/decryption
- ⏸️ Full end-to-end testing
- ⏸️ Actual token swaps with encryption
- ⏸️ Balance decryption

---

## Next Steps for Full Testing

1. **Update Solidity contracts** to use `@fhevm/solidity`
2. **Deploy contracts** to Zama devnet
3. **Get system contract addresses** from Zama docs:
   - KMS Contract
   - ACL Contract
   - Input Verifier Contract
   - Decryption Contract
4. **Update** `client/src/lib/fhevm.ts` with real addresses
5. **Test** full encryption/decryption flow

---

## Test Status: ✅ PASSED (Partial)

**Integration Level:** ✅ Complete
**Sepolia Support:** ✅ Expected to work
**Zama Support:** ⏸️ Waiting on contract deployment
**Code Quality:** ✅ No TypeScript errors
**Documentation:** ✅ Updated

---

Last Updated: 2025-10-30

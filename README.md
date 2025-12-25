# Weight Trend - Encrypted Weight Tracking System

A fully homomorphic encryption (FHE) enabled application for tracking daily weight changes with privacy-preserving comparisons.

## Features

- **Privacy Protection**: Advanced encryption for sensitive data using FHE technology
- **Real-time Analytics**: Live trend monitoring capabilities with instant feedback
- **Encrypted Weight Storage**: Submit daily weight data that remains encrypted on-chain
- **Trend Analysis**: Compare today's weight with yesterday's weight without revealing actual values
- **Privacy-First**: Uses Zama FHEVM for fully homomorphic encryption operations
- **Rainbow Wallet Integration**: Connect using Rainbow wallet for seamless Web3 experience
- **Batch Operations**: Support for submitting multiple weight records in single transaction
- **Advanced Analytics**: Calculate averages and analyze weight changes over custom periods
- **Access Control**: Role-based permissions with admin and user management
- **Error Handling**: Comprehensive error categorization and user-friendly messages

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager
- **Rainbow Wallet**: Browser extension installed

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd frontend
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Run frontend**

   ```bash
   cd frontend
   npm run dev
   ```

## 🎥 Demo Video & Deployment

* **📹 Demo Video**: [Watch the full demonstration](https://github.com/DaleBurke/self-recording/blob/main/privateself.mp4) of the encrypted weight tracking system in action
* **🚀 Live Deployment**: [https://privateselff.vercel.app/](https://privateselff.vercel.app/) \- Try the live application with Rainbow wallet integration
* **📄 Sepolia Testnet Contract**: `0x6f39f4caD4C3ca052BB0CAe7AD4C957DE964E66B` \- View on [Etherscan](https://sepolia.etherscan.io/address/0x6f39f4caD4C3ca052BB0CAe7AD4C957DE964E66B)
* **🔐 Privacy Features**: Experience fully homomorphic encryption protecting your health data
* **📊 Real-time Analytics**: See encrypted weight trend comparisons without revealing actual values

## 📁 Project Structure

```
weight-trend-fhevm/
├── contracts/              # Smart contract source files
│   └── WeightTrend.sol    # FHE weight tracking contract
├── deploy/                 # Deployment scripts
├── tasks/                  # Hardhat custom tasks
├── test/                   # Test files and specifications
├── frontend/               # Next.js frontend application
│   ├── abi/                # Generated contract ABIs
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   ├── fhevm/              # FHEVM integration utilities
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── deployments/        # Contract deployment addresses
├── artifacts/              # Compiled contract artifacts
├── types/                  # TypeScript type definitions
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Dependencies and scripts
└── README.md              # Project documentation
```

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## How It Works

1. **Connect Wallet**: Users connect their Rainbow wallet to the application
2. **Submit Weight**: Users submit their daily weight in encrypted form using FHEVM
3. **Batch Operations**: Support for submitting multiple weight records in single transaction
4. **Trend Analysis**: The contract compares today's encrypted weight with yesterday's encrypted weight
5. **Advanced Analytics**: Calculate averages and analyze weight changes over custom periods
6. **Decrypt Result**: Users can decrypt the comparison result to see if their weight decreased
7. **Admin Functions**: Administrative features for system management and user oversight

The actual weight values are never revealed on-chain - only the comparison results can be decrypted by the user, ensuring complete privacy while enabling powerful analytics.

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

## 🔒 Security Considerations

- **Fully Homomorphic Encryption**: All weight data is encrypted using Zama FHEVM, ensuring privacy-preserving computations
- **Access Control**: Role-based permissions with admin and user management to prevent unauthorized operations
- **Input Validation**: Comprehensive validation prevents invalid data and ensures system integrity
- **Private Keys**: Never exposed on-chain; all operations use encrypted inputs and outputs
- **Smart Contract Security**: Follows best practices with proper error handling and gas optimization
- **Audit Ready**: Code structured for formal security audits and compliance requirements

## 🛠️ Architecture

The system consists of three main components:

1. **Smart Contracts** (`contracts/`): FHEVM-powered contracts handling encrypted weight operations
2. **Frontend Application** (`frontend/`): React/Next.js app with Rainbow wallet integration
3. **Development Tools** (`test/`, `tasks/`): Comprehensive testing and deployment utilities

## 🤝 Contributing

We welcome contributions! Please ensure all tests pass before submitting pull requests.

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with ❤️ using Zama FHEVM**



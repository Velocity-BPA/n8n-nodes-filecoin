# n8n-nodes-filecoin

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node package for the **Filecoin blockchain**, enabling seamless integration of decentralized storage operations into your n8n workflows. Features 19 resource categories with 80+ operations covering wallet management, storage deals, FEVM smart contracts, IPFS integration, and real-time blockchain monitoring.

![Filecoin](https://img.shields.io/badge/Filecoin-0090FF?style=for-the-badge&logo=filecoin&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-BSL--1.1-blue?style=for-the-badge)

## Features

- **19 Resource Types** - Complete coverage of Filecoin functionality
- **80+ Operations** - From wallet management to storage deals
- **Multi-Network Support** - Mainnet, Calibration, Hyperspace, and custom endpoints
- **FEVM Integration** - Full Ethereum-compatible smart contract support
- **IPFS Operations** - Seamless file storage and retrieval
- **Real-Time Triggers** - Monitor blockchain events and transactions
- **Type-Safe** - Full TypeScript implementation with comprehensive types

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-filecoin`
5. Accept the risks and install

### Manual Installation

```bash
# Navigate to your n8n nodes directory
cd ~/.n8n/nodes

# Install the package
npm install n8n-nodes-filecoin

# Restart n8n
n8n start
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-filecoin.git
cd n8n-nodes-filecoin

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n nodes directory
mkdir -p ~/.n8n/nodes
ln -s $(pwd) ~/.n8n/nodes/n8n-nodes-filecoin

# Restart n8n
n8n start
```

## Credentials Setup

### Filecoin Network

| Field | Description | Required |
|-------|-------------|----------|
| Network | Mainnet, Calibration, Hyperspace, or Custom | Yes |
| Lotus RPC URL | RPC endpoint URL | Yes |
| Lotus API Token | API authentication token | No |
| Private Key | Wallet private key (hex) | No |
| Address Type | f1 (secp256k1) or f3 (BLS) | No |
| Glif API URL | Glif explorer API endpoint | No |
| FEVM RPC URL | Ethereum-compatible RPC URL | No |

### Storage Provider

| Field | Description | Required |
|-------|-------------|----------|
| Provider Endpoint | Storage provider API URL | Yes |
| Auth Token | Authentication token | No |
| Provider ID | Storage provider ID (f0xxxx) | No |

### FEVM (Filecoin EVM)

| Field | Description | Required |
|-------|-------------|----------|
| FEVM RPC URL | EVM-compatible RPC endpoint | Yes |
| Private Key | Ethereum format private key | No |
| Chain ID | 314 (mainnet) or 314159 (calibration) | Yes |

## Resources & Operations

### Wallet
- Get Balance, Get Address Info, Create Wallet
- Export/Import Private Key, List Wallets
- Sign Message, Validate/Convert Address

### Transaction
- Send FIL, Get Message, Wait for Confirmation
- Estimate Gas, Build/Sign/Push Message
- Get Chain Head, Get Base Fee

### Storage Deal
- Create Deal, Get Deal Info/Status
- List Deals, Query Ask, Verify Data

### Storage Provider
- Get Provider Info, List Providers
- Get Power/Faults/Sectors/Balance
- Get Proving Deadline

### Retrieval
- Create Retrieval Deal, Get Offer/Status
- Query Providers, Start/Cancel Retrieval

### DataCap (Fil+)
- Get Balance/Allocations
- Get Verified Clients/Notaries
- Request DataCap

### Sector
- Get Sector Info/State/Expiration
- List Sectors, Get Faults/Recoveries
- Get Proving Deadlines

### Power
- Get Network/Miner Power
- Get Power Table, Network Stats

### Market
- Get Balance, Add/Withdraw Funds
- Get Escrow/Locked, Get Deal States

### Miner
- Get Info/Power/Balance
- Get Faults/Deadlines/Partitions
- Get Proving Period

### FEVM (Filecoin EVM)
- Get ETH Balance, Send Transaction
- Deploy/Call Contract, Get Logs
- Estimate Gas, Convert Address (f4 ↔ 0x)

### FVM (Filecoin VM)
- Invoke Actor, Get Actor State/Code
- List Actors, Get Events

### Chain
- Get Head/Tipset/Block/Messages
- Get Stats/Version/Genesis

### State
- Get State at Tipset, Get Actor
- Read State, Get Circulating Supply

### Gas
- Estimate Premium/Limit/Gas
- Get Base Fee/Fee Cap

### Multisig
- Create Multisig, Propose/Approve/Cancel
- Add/Remove/Swap Signer, Change Threshold

### Payment Channel
- Create/Update/Settle/Collect Channel
- Allocate Lane, Submit Voucher

### IPFS
- Add/Get File, Pin/Unpin
- Get Stats, Import/Export CAR

### Utility
- Convert Units, Validate/Format CID
- Convert Address, Sign/Verify Data
- Get Network Info/Version

## Trigger Node

The **Filecoin Trigger** node monitors blockchain events in real-time:

| Trigger Type | Description |
|--------------|-------------|
| New Tipset | Triggers on new chain block |
| Balance Changed | Monitors address balance changes |
| Message Confirmed | Triggers when a message is confirmed |
| FIL Received | Monitors incoming FIL transfers |
| Deal Status Changed | Monitors storage deal state changes |
| Miner Power Changed | Triggers on miner power changes |
| Base Fee Changed | Monitors gas base fee changes |

## Usage Examples

### Send FIL

```javascript
{
  "resource": "transaction",
  "operation": "sendFil",
  "toAddress": "f1xyz...",
  "amount": "1.5"
}
```

### Check Wallet Balance

```javascript
{
  "resource": "wallet",
  "operation": "getBalance",
  "address": "f1abc..."
}
// Returns: { balance: "1500000000000000000", formatted: "1.5 FIL" }
```

### Deploy Smart Contract (FEVM)

```javascript
{
  "resource": "fevm",
  "operation": "deployContract",
  "bytecode": "0x608060...",
  "constructorArgs": ["MyToken", "MTK", "1000000000000000000000"]
}
```

### Add File to IPFS

```javascript
{
  "resource": "ipfs",
  "operation": "addFile",
  "content": "Hello Filecoin!",
  "filename": "hello.txt"
}
// Returns: { cid: "Qm...", size: "16" }
```

## Filecoin Concepts

### Address Types
- **f0**: ID addresses (actor IDs)
- **f1**: Secp256k1 addresses (most common wallets)
- **f2**: Actor addresses (smart contracts)
- **f3**: BLS addresses (validators)
- **f4**: Delegated addresses (FEVM 0x compatibility)

### Units
- **FIL**: Base unit (1 FIL = 10^18 attoFIL)
- **attoFIL**: Smallest unit (like Wei in Ethereum)
- **nanoFIL**: 10^9 attoFIL

### Storage Deals
Storage deals are agreements between clients and storage providers to store data for a specified duration. Deals go through several states: Proposed → Published → Active → Expired.

## Networks

| Network | Chain ID | RPC Endpoint |
|---------|----------|--------------|
| Mainnet | 314 | https://api.node.glif.io/rpc/v1 |
| Calibration | 314159 | https://api.calibration.node.glif.io/rpc/v1 |
| Hyperspace | 3141 | https://api.hyperspace.node.glif.io/rpc/v1 |

## Error Handling

The node implements comprehensive error handling:
- Network connectivity errors with retry logic
- RPC response validation
- Address format validation
- Transaction confirmation monitoring
- Gas estimation fallbacks

## Security Best Practices

1. **Never expose private keys** in logs or error messages
2. **Use environment variables** for sensitive credentials
3. **Test on Calibration testnet** before mainnet deployment
4. **Validate all addresses** before transactions
5. **Set appropriate gas limits** to prevent failed transactions

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-filecoin/issues)
- **Documentation**: [Filecoin Docs](https://docs.filecoin.io/)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)

## Acknowledgments

- [Filecoin](https://filecoin.io/) - Decentralized storage network
- [n8n](https://n8n.io/) - Workflow automation platform
- [Glif](https://glif.io/) - Filecoin tooling and APIs
- [Protocol Labs](https://protocol.ai/) - IPFS and Filecoin development

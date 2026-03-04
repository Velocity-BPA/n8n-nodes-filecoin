# n8n-nodes-filecoin

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

This n8n community node provides comprehensive integration with the Filecoin network, featuring 6 core resources for blockchain operations, decentralized storage, and smart contract interactions. Seamlessly interact with Filecoin's distributed storage network, manage wallets, execute transactions, and leverage IPFS capabilities directly within your n8n workflows.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Filecoin](https://img.shields.io/badge/Filecoin-Network-orange)
![IPFS](https://img.shields.io/badge/IPFS-Enabled-green)
![Blockchain](https://img.shields.io/badge/Blockchain-Storage-purple)

## Features

- **Chain Operations** - Query blockchain state, retrieve blocks, and monitor network statistics
- **Wallet Management** - Create wallets, check balances, and manage FIL transactions
- **Message Handling** - Send messages, track confirmations, and retrieve transaction history
- **Decentralized Storage** - Store and retrieve files using Filecoin's storage network
- **Smart Contract Integration** - Deploy, interact with, and monitor smart contracts on Filecoin
- **IPFS Support** - Pin content, retrieve files, and manage distributed content addressing
- **Real-time Monitoring** - Track storage deals, miner status, and network health
- **Comprehensive Error Handling** - Robust error management with detailed logging

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-filecoin`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-filecoin
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-filecoin.git
cd n8n-nodes-filecoin
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-filecoin
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| API Key | Your Filecoin API key for authentication | Yes |
| Network | Target network (mainnet, testnet, devnet) | Yes |
| RPC Endpoint | Custom RPC endpoint URL (optional) | No |
| Timeout | Request timeout in milliseconds (default: 30000) | No |

## Resources & Operations

### 1. Chain

| Operation | Description |
|-----------|-------------|
| Get Block | Retrieve block information by CID or height |
| Get Chain Head | Get the current chain head |
| Get Actor | Retrieve actor information by address |
| Get Receipt | Get message receipt by CID |
| Get Tipset | Retrieve tipset information |
| Get Gas Estimate | Estimate gas for message execution |

### 2. Wallet

| Operation | Description |
|-----------|-------------|
| Create Wallet | Generate a new wallet address |
| Get Balance | Retrieve wallet balance |
| List Wallets | Get all wallet addresses |
| Export Wallet | Export wallet private key |
| Sign Message | Sign a message with wallet |
| Verify Signature | Verify message signature |

### 3. Message

| Operation | Description |
|-----------|-------------|
| Send Message | Send a message to the network |
| Get Message | Retrieve message by CID |
| List Messages | Get messages for an address |
| Wait Message | Wait for message confirmation |
| Search Messages | Search messages by criteria |
| Get Message Status | Check message execution status |

### 4. Storage

| Operation | Description |
|-----------|-------------|
| Store File | Store file on Filecoin network |
| Retrieve File | Retrieve file from storage |
| List Deals | Get storage deals |
| Get Deal Status | Check storage deal status |
| Create Deal | Initiate new storage deal |
| List Miners | Get available storage miners |

### 5. Smart Contract

| Operation | Description |
|-----------|-------------|
| Deploy Contract | Deploy smart contract to network |
| Call Method | Execute contract method |
| Get Contract Info | Retrieve contract details |
| List Events | Get contract events |
| Estimate Gas | Estimate gas for contract call |
| Get Code | Retrieve contract bytecode |

### 6. IPFS

| Operation | Description |
|-----------|-------------|
| Add File | Add file to IPFS |
| Get File | Retrieve file from IPFS |
| Pin Content | Pin content to prevent garbage collection |
| Unpin Content | Remove pin from content |
| List Pins | Get all pinned content |
| Get Node Info | Retrieve IPFS node information |

## Usage Examples

```javascript
// Store a file on Filecoin network
{
  "resource": "Storage",
  "operation": "Store File",
  "fileData": "base64encodedfiledata",
  "fileName": "document.pdf",
  "duration": 518400,
  "price": "0.0001"
}
```

```javascript
// Send FIL tokens between wallets
{
  "resource": "Message",
  "operation": "Send Message",
  "from": "f1abc123def456...",
  "to": "f1xyz789uvw012...",
  "value": "1.5",
  "gasLimit": 1000000,
  "gasFeeCap": "0.000001"
}
```

```javascript
// Query blockchain for latest block
{
  "resource": "Chain",
  "operation": "Get Chain Head",
  "includeMessages": true,
  "includeReceipts": false
}
```

```javascript
// Deploy smart contract
{
  "resource": "SmartContract",
  "operation": "Deploy Contract",
  "bytecode": "0x608060405234801561001057600080fd5b50...",
  "constructor": [],
  "gasLimit": 5000000,
  "gasPrice": "0.000001"
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Invalid API Key | Authentication failed | Verify API key in credentials |
| Network Timeout | Request exceeded timeout limit | Increase timeout or check network connectivity |
| Insufficient Balance | Not enough FIL for transaction | Add funds to wallet or reduce transaction amount |
| Invalid Address | Wallet address format incorrect | Verify address format (f1...) |
| Gas Estimation Failed | Unable to estimate gas costs | Check message parameters and network status |
| Storage Deal Failed | Storage deal could not be created | Verify file size, duration, and miner availability |

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run dev
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
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-filecoin/issues)
- **Filecoin Documentation**: [docs.filecoin.io](https://docs.filecoin.io)
- **Filecoin Community**: [filecoin.io/community](https://filecoin.io/community)
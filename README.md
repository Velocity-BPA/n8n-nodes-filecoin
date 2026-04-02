# n8n-nodes-filecoin

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

This n8n community node provides seamless integration with the Filecoin network, enabling developers to interact with decentralized storage, blockchain data, and network operations. With 6 comprehensive resources and extensive operation support, it facilitates storage deal management, wallet operations, message handling, and network monitoring within your n8n workflows.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Filecoin](https://img.shields.io/badge/Filecoin-Network-cyan)
![IPFS](https://img.shields.io/badge/IPFS-Compatible-green)
![Blockchain](https://img.shields.io/badge/Blockchain-Decentralized%20Storage-purple)

## Features

- **Complete Storage Management** - Create, monitor, and manage Filecoin storage deals with comprehensive lifecycle tracking
- **Wallet Operations** - Perform wallet balance checks, transaction creation, and address management across the network
- **Blockchain Interaction** - Access chain head data, block information, and network state for monitoring and analytics
- **Actor System Integration** - Interact with Filecoin actors, retrieve state information, and execute actor-specific operations
- **Message Broadcasting** - Send, track, and verify messages on the Filecoin network with detailed status monitoring
- **Network Analytics** - Monitor network statistics, peer information, and protocol versions for operational insights
- **Real-time Monitoring** - Track deal status, transaction confirmations, and network health in automated workflows
- **Enterprise Security** - Secure API key authentication with comprehensive error handling and retry mechanisms

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
| API Key | Your Filecoin node API key or access token | Yes |
| Node URL | Filecoin node endpoint URL (e.g., https://api.node.glif.io) | Yes |
| Network | Target network (mainnet, calibration, etc.) | No |

## Resources & Operations

### 1. Chain

| Operation | Description |
|-----------|-------------|
| Get Head | Retrieve the current chain head information |
| Get Block | Get specific block data by CID or height |
| Get Messages | Retrieve messages from a specific block |
| Get Parent Receipts | Get receipts for parent block messages |
| Get Tipset | Retrieve tipset information by height or key |
| Read State | Read current chain state information |

### 2. Actor

| Operation | Description |
|-----------|-------------|
| Get Actor | Retrieve actor information by address |
| Get State | Get current actor state data |
| List Actors | List all actors in the system |
| Get Code | Retrieve actor code information |
| Get Actor Events | Get events emitted by an actor |
| Call Method | Execute actor method calls |

### 3. Message

| Operation | Description |
|-----------|-------------|
| Send Message | Broadcast a message to the Filecoin network |
| Get Message | Retrieve message details by CID |
| Get Receipt | Get message execution receipt |
| Search Messages | Search for messages by criteria |
| Estimate Gas | Estimate gas costs for message execution |
| Wait for Message | Wait for message confirmation and results |

### 4. Wallet

| Operation | Description |
|-----------|-------------|
| Get Balance | Check wallet balance for an address |
| List Wallets | List all available wallet addresses |
| Create Wallet | Generate a new wallet address |
| Import Wallet | Import an existing wallet |
| Sign Message | Sign a message with wallet private key |
| Verify Signature | Verify message signature authenticity |

### 5. Storage

| Operation | Description |
|-----------|-------------|
| Create Deal | Initiate a new storage deal |
| Get Deal | Retrieve storage deal information |
| List Deals | List all storage deals by criteria |
| Get Deal Status | Check current status of storage deals |
| Calculate Price | Estimate storage costs and pricing |
| Find Miners | Discover available storage miners |

### 6. Network

| Operation | Description |
|-----------|-------------|
| Get Network Info | Retrieve network statistics and information |
| Get Peers | List connected network peers |
| Get Version | Get node version and protocol information |
| Sync Status | Check node synchronization status |
| Get Network Name | Retrieve current network identifier |
| Connection Status | Monitor network connection health |

## Usage Examples

```javascript
// Monitor storage deal status
{
  "nodes": [
    {
      "name": "Check Deal Status",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Storage",
        "operation": "Get Deal Status",
        "dealCid": "bafyreiabcd1234567890abcdef"
      }
    }
  ]
}
```

```javascript
// Check wallet balance and send payment
{
  "nodes": [
    {
      "name": "Get Wallet Balance",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Wallet",
        "operation": "Get Balance",
        "address": "f1abc123def456ghi789jkl012mno345pqr678stu"
      }
    },
    {
      "name": "Send Payment",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Message",
        "operation": "Send Message",
        "from": "f1abc123def456ghi789jkl012mno345pqr678stu",
        "to": "f1xyz789uvw456rst123opq890lmn567hij234klm",
        "value": "1000000000000000000"
      }
    }
  ]
}
```

```javascript
// Monitor network health and sync status
{
  "nodes": [
    {
      "name": "Check Network Status",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Network",
        "operation": "Sync Status"
      }
    },
    {
      "name": "Get Chain Head",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Chain",
        "operation": "Get Head"
      }
    }
  ]
}
```

```javascript
// Create and monitor storage deal
{
  "nodes": [
    {
      "name": "Find Storage Miners",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Storage",
        "operation": "Find Miners",
        "minPower": "32GiB",
        "maxPrice": "0.0000000001"
      }
    },
    {
      "name": "Create Storage Deal",
      "type": "n8n-nodes-filecoin.Filecoin",
      "parameters": {
        "resource": "Storage",
        "operation": "Create Deal",
        "dataCid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        "miner": "f01000",
        "duration": 1555200
      }
    }
  ]
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Invalid API Key | Authentication failed with provided credentials | Verify API key is correct and has sufficient permissions |
| Network Timeout | Request timed out waiting for network response | Check node connectivity and increase timeout settings |
| Insufficient Funds | Wallet balance too low for transaction | Verify wallet has adequate FIL balance for operation |
| Actor Not Found | Specified actor address does not exist | Confirm actor address is valid and properly formatted |
| Deal Creation Failed | Storage deal proposal was rejected | Check deal parameters, miner availability, and pricing |
| Message Pending | Transaction is still being processed | Wait for confirmation or check message status periodically |

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
/**
 * Copyright (c) 2026 Velocity BPA
 * 
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     https://github.com/VelocityBPA/n8n-nodes-filecoin/blob/main/LICENSE
 * 
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeApiError,
} from 'n8n-workflow';

export class Filecoin implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Filecoin',
    name: 'filecoin',
    icon: 'file:filecoin.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Filecoin API',
    defaults: {
      name: 'Filecoin',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'filecoinApi',
        required: true,
      },
    ],
    properties: [
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Chain',
            value: 'chain',
          },
          {
            name: 'Wallet',
            value: 'wallet',
          },
          {
            name: 'Message',
            value: 'message',
          },
          {
            name: 'Storage',
            value: 'storage',
          },
          {
            name: 'SmartContract',
            value: 'smartContract',
          },
          {
            name: 'IPFS',
            value: 'iPFS',
          }
        ],
        default: 'chain',
      },
      // Operation dropdowns per resource
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['chain'],
    },
  },
  options: [
    {
      name: 'Get Chain Head',
      value: 'getHead',
      description: 'Get the current chain head',
      action: 'Get chain head',
    },
    {
      name: 'Get Block',
      value: 'getBlock',
      description: 'Get block information by CID',
      action: 'Get block information',
    },
    {
      name: 'Get Tipset by Height',
      value: 'getTipsetByHeight',
      description: 'Get tipset at specific height',
      action: 'Get tipset by height',
    },
    {
      name: 'Get Genesis',
      value: 'getGenesis',
      description: 'Get genesis block information',
      action: 'Get genesis block',
    },
    {
      name: 'Read State',
      value: 'readState',
      description: 'Read actor state at tipset',
      action: 'Read actor state',
    },
  ],
  default: 'getHead',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['wallet'],
    },
  },
  options: [
    {
      name: 'Create New Wallet Address',
      value: 'walletNew',
      description: 'Create a new wallet address',
      action: 'Create new wallet address',
    },
    {
      name: 'List Wallet Addresses',
      value: 'walletList',
      description: 'List all wallet addresses',
      action: 'List wallet addresses',
    },
    {
      name: 'Get Wallet Balance',
      value: 'walletBalance',
      description: 'Get the balance of a wallet address',
      action: 'Get wallet balance',
    },
    {
      name: 'Sign Data',
      value: 'walletSign',
      description: 'Sign data with a wallet address',
      action: 'Sign data with wallet',
    },
    {
      name: 'Delete Wallet Address',
      value: 'walletDelete',
      description: 'Delete a wallet address',
      action: 'Delete wallet address',
    },
  ],
  default: 'walletNew',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['message'],
    },
  },
  options: [
    {
      name: 'Send Message to Mempool',
      value: 'mpoolPush',
      description: 'Send a signed message to the mempool',
      action: 'Send message to mempool',
    },
    {
      name: 'Get Pending Messages',
      value: 'mpoolPending',
      description: 'Get pending messages from the mempool',
      action: 'Get pending messages',
    },
    {
      name: 'Wait for Message Confirmation',
      value: 'stateWaitMsg',
      description: 'Wait for message confirmation',
      action: 'Wait for message confirmation',
    },
    {
      name: 'Estimate Gas Limit',
      value: 'gasEstimateGasLimit',
      description: 'Estimate gas limit for a message',
      action: 'Estimate gas limit',
    },
    {
      name: 'Search Message by CID',
      value: 'stateSearchMsg',
      description: 'Search for a message by CID',
      action: 'Search message by CID',
    },
  ],
  default: 'mpoolPush',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['storage'],
    },
  },
  options: [
    {
      name: 'List Storage Deals',
      value: 'clientListDeals',
      description: 'List all storage deals for the client',
      action: 'List storage deals',
    },
    {
      name: 'Start Storage Deal',
      value: 'clientStartDeal',
      description: 'Start a new storage deal with a miner',
      action: 'Start storage deal',
    },
    {
      name: 'Get Deal Information',
      value: 'clientGetDealInfo',
      description: 'Get information about a specific storage deal',
      action: 'Get deal information',
    },
    {
      name: 'Get Miner Information',
      value: 'stateMinerInfo',
      description: 'Get information about a specific miner',
      action: 'Get miner information',
    },
    {
      name: 'List All Miners',
      value: 'stateListMiners',
      description: 'List all miners in the network',
      action: 'List all miners',
    },
  ],
  default: 'clientListDeals',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
    },
  },
  options: [
    {
      name: 'Call Contract Method',
      value: 'ethCall',
      description: 'Call a smart contract method without creating a transaction',
      action: 'Call contract method',
    },
    {
      name: 'Send Raw Transaction',
      value: 'ethSendRawTransaction',
      description: 'Send a signed raw transaction to the network',
      action: 'Send raw transaction',
    },
    {
      name: 'Get Transaction Receipt',
      value: 'ethGetTransactionReceipt',
      description: 'Get the receipt of a transaction by hash',
      action: 'Get transaction receipt',
    },
    {
      name: 'Estimate Gas',
      value: 'ethEstimateGas',
      description: 'Estimate the gas needed for a transaction',
      action: 'Estimate gas',
    },
    {
      name: 'Get Contract Code',
      value: 'ethGetCode',
      description: 'Get the bytecode of a smart contract',
      action: 'Get contract code',
    },
  ],
  default: 'ethCall',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['iPFS'],
    },
  },
  options: [
    {
      name: 'Client Import',
      value: 'clientImport',
      description: 'Import data to IPFS',
      action: 'Import data to IPFS',
    },
    {
      name: 'Client Retrieve',
      value: 'clientRetrieve',
      description: 'Retrieve data from IPFS',
      action: 'Retrieve data from IPFS',
    },
    {
      name: 'Client Query Ask',
      value: 'clientQueryAsk',
      description: 'Query storage ask price',
      action: 'Query storage ask price',
    },
    {
      name: 'Client List Imports',
      value: 'clientListImports',
      description: 'List imported data',
      action: 'List imported data',
    },
    {
      name: 'Client Remove Import',
      value: 'clientRemoveImport',
      description: 'Remove imported data',
      action: 'Remove imported data',
    },
  ],
  default: 'clientImport',
},
      // Parameter definitions
{
  displayName: 'Block CID',
  name: 'cid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['chain'],
      operation: ['getBlock'],
    },
  },
  default: '',
  description: 'The Content Identifier (CID) of the block to retrieve',
  placeholder: 'bafy2bzaced...',
},
{
  displayName: 'Height',
  name: 'height',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['chain'],
      operation: ['getTipsetByHeight'],
    },
  },
  default: 0,
  description: 'The block height to retrieve the tipset for',
  typeOptions: {
    minValue: 0,
  },
},
{
  displayName: 'Actor Address',
  name: 'actor',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['chain'],
      operation: ['readState'],
    },
  },
  default: '',
  description: 'The address of the actor to read state from (supports f0, f1, f2, f3, f4 formats)',
  placeholder: 'f01234 or f410f...',
},
{
  displayName: 'Tipset Key',
  name: 'tipsetKey',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['chain'],
      operation: ['readState'],
    },
  },
  default: '',
  description: 'The tipset key (optional, uses chain head if not provided)',
  placeholder: 'Leave empty for chain head',
},
{
  displayName: 'Key Type',
  name: 'keyType',
  type: 'options',
  required: true,
  displayOptions: {
    show: {
      resource: ['wallet'],
      operation: ['walletNew'],
    },
  },
  options: [
    {
      name: 'secp256k1',
      value: 'secp256k1',
    },
    {
      name: 'bls',
      value: 'bls',
    },
  ],
  default: 'secp256k1',
  description: 'The type of key to create for the new wallet',
},
{
  displayName: 'Address',
  name: 'address',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['wallet'],
      operation: ['walletBalance', 'walletSign', 'walletDelete'],
    },
  },
  default: '',
  description: 'The wallet address (f0, f1, f2, f3, or f4 format)',
},
{
  displayName: 'Data to Sign',
  name: 'data',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['wallet'],
      operation: ['walletSign'],
    },
  },
  default: '',
  description: 'The data to sign (base64 encoded)',
},
{
  displayName: 'Signed Message',
  name: 'signedMessage',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['message'],
      operation: ['mpoolPush'],
    },
  },
  default: '{}',
  description: 'The signed message object to send to the mempool',
},
{
  displayName: 'Tipset Key',
  name: 'tipsetKey',
  type: 'json',
  required: false,
  displayOptions: {
    show: {
      resource: ['message'],
      operation: ['mpoolPending', 'gasEstimateGasLimit'],
    },
  },
  default: '[]',
  description: 'The tipset key array (optional for some operations)',
},
{
  displayName: 'Message CID',
  name: 'messageCid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['message'],
      operation: ['stateWaitMsg', 'stateSearchMsg'],
    },
  },
  default: '',
  description: 'The CID of the message to wait for or search',
},
{
  displayName: 'Confidence',
  name: 'confidence',
  type: 'number',
  required: false,
  displayOptions: {
    show: {
      resource: ['message'],
      operation: ['stateWaitMsg'],
    },
  },
  default: 5,
  description: 'Number of confirmations to wait for',
},
{
  displayName: 'Message',
  name: 'message',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['message'],
      operation: ['gasEstimateGasLimit'],
    },
  },
  default: '{}',
  description: 'The message object for gas estimation',
},
{
  displayName: 'Deal Parameters',
  name: 'dealParams',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['storage'],
      operation: ['clientStartDeal'],
    },
  },
  default: '{}',
  description: 'JSON object containing deal parameters including data, wallet, miner, epoch price, min blocks duration, deal start epoch, fast retrieval, verified deal',
},
{
  displayName: 'Deal CID',
  name: 'dealCid',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['storage'],
      operation: ['clientGetDealInfo'],
    },
  },
  default: '',
  description: 'The CID (Content Identifier) of the deal to retrieve information for',
},
{
  displayName: 'Miner Address',
  name: 'minerAddress',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['storage'],
      operation: ['stateMinerInfo'],
    },
  },
  default: '',
  description: 'The address of the miner (f0, f1, f2, f3, or f4 format)',
},
{
  displayName: 'Tipset Key',
  name: 'tipsetKey',
  type: 'json',
  required: false,
  displayOptions: {
    show: {
      resource: ['storage'],
      operation: ['stateMinerInfo', 'stateListMiners'],
    },
  },
  default: 'null',
  description: 'The tipset key to query at, null for latest tipset',
},
{
  displayName: 'Transaction Object',
  name: 'transaction',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['ethCall', 'ethEstimateGas'],
    },
  },
  default: '{"to": "", "data": ""}',
  description: 'The transaction call object with fields like to, from, data, gas, gasPrice, value',
  placeholder: '{"to": "0x...", "data": "0x...", "from": "0x..."}',
},
{
  displayName: 'Block Number',
  name: 'blockNumber',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['ethCall', 'ethGetCode'],
    },
  },
  default: 'latest',
  description: 'The block number to execute the call against. Use "latest", "earliest", "pending", or a specific block number',
  placeholder: 'latest',
},
{
  displayName: 'Signed Transaction Data',
  name: 'signedTransaction',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['ethSendRawTransaction'],
    },
  },
  default: '',
  description: 'The signed transaction data as a hex string',
  placeholder: '0x...',
},
{
  displayName: 'Transaction Hash',
  name: 'transactionHash',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['ethGetTransactionReceipt'],
    },
  },
  default: '',
  description: 'The hash of the transaction to get the receipt for',
  placeholder: '0x...',
},
{
  displayName: 'Contract Address',
  name: 'address',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['ethGetCode'],
    },
  },
  default: '',
  description: 'The address of the smart contract',
  placeholder: '0x...',
},
{
  displayName: 'Import Parameters',
  name: 'importParams',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['iPFS'],
      operation: ['clientImport'],
    },
  },
  default: '{"Path": "/path/to/file", "IsCAR": false}',
  description: 'Parameters for importing data to IPFS',
},
{
  displayName: 'Retrieve Order',
  name: 'retrieveOrder',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['iPFS'],
      operation: ['clientRetrieve'],
    },
  },
  default: '{"Root": "bafkreih...cid", "Piece": null, "Size": 0, "Total": "0", "UnsealPrice": "0", "PaymentInterval": 0, "PaymentIntervalIncrease": 0, "Client": "f3...", "Provider": "f01000", "MinerPeer": {"ID": "12D3KooW...", "Addrs": []}}',
  description: 'Retrieve order parameters',
},
{
  displayName: 'Peer ID',
  name: 'peerId',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['iPFS'],
      operation: ['clientQueryAsk'],
    },
  },
  default: '',
  description: 'The peer ID to query',
},
{
  displayName: 'Miner Address',
  name: 'minerAddress',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['iPFS'],
      operation: ['clientQueryAsk'],
    },
  },
  default: '',
  description: 'The miner address (f0... format)',
},
{
  displayName: 'Import ID',
  name: 'importID',
  type: 'number',
  required: true,
  displayOptions: {
    show: {
      resource: ['iPFS'],
      operation: ['clientRemoveImport'],
    },
  },
  default: 0,
  description: 'The ID of the import to remove',
},
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;

    switch (resource) {
      case 'chain':
        return [await executeChainOperations.call(this, items)];
      case 'wallet':
        return [await executeWalletOperations.call(this, items)];
      case 'message':
        return [await executeMessageOperations.call(this, items)];
      case 'storage':
        return [await executeStorageOperations.call(this, items)];
      case 'smartContract':
        return [await executeSmartContractOperations.call(this, items)];
      case 'iPFS':
        return [await executeIPFSOperations.call(this, items)];
      default:
        throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported`);
    }
  }
}

// ============================================================
// Resource Handler Functions
// ============================================================

async function executeChainOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('filecoinApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      
      const baseOptions: any = {
        method: 'POST',
        url: credentials.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        json: true,
      };

      switch (operation) {
        case 'getHead': {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ChainHead',
            params: [],
            id: 1,
          };
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          
          if (response.error) {
            throw new NodeApiError(this.getNode(), response.error, {
              message: `Filecoin API Error: ${response.error.message}`,
            });
          }
          
          result = response.result;
          break;
        }

        case 'getBlock': {
          const cid = this.getNodeParameter('cid', i) as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ChainGetBlock',
            params: [{
              '/': cid,
            }],
            id: 1,
          };
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          
          if (response.error) {
            throw new NodeApiError(this.getNode(), response.error, {
              message: `Filecoin API Error: ${response.error.message}`,
            });
          }
          
          result = response.result;
          break;
        }

        case 'getTipsetByHeight': {
          const height = this.getNodeParameter('height', i) as number;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ChainGetTipSetByHeight',
            params: [height, null],
            id: 1,
          };
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          
          if (response.error) {
            throw new NodeApiError(this.getNode(), response.error, {
              message: `Filecoin API Error: ${response.error.message}`,
            });
          }
          
          result = response.result;
          break;
        }

        case 'getGenesis': {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ChainGetGenesis',
            params: [],
            id: 1,
          };
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          
          if (response.error) {
            throw new NodeApiError(this.getNode(), response.error, {
              message: `Filecoin API Error: ${response.error.message}`,
            });
          }
          
          result = response.result;
          break;
        }

        case 'readState': {
          const actor = this.getNodeParameter('actor', i) as string;
          const tipsetKey = this.getNodeParameter('tipsetKey', i) as string;
          
          // If tipsetKey is provided, parse it as a tipset key, otherwise use null for chain head
          const tipsetParam = tipsetKey ? JSON.parse(tipsetKey) : null;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.StateReadState',
            params: [actor, tipsetParam],
            id: 1,
          };
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          
          if (response.error) {
            throw new NodeApiError(this.getNode(), response.error, {
              message: `Filecoin API Error: ${response.error.message}`,
            });
          }
          
          result = response.result;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
            itemIndex: i,
          });
      }

      returnData.push({
        json: result,
        pairedItem: { item: i },
      });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i },
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

async function executeWalletOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('filecoinApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'walletNew': {
          const keyType = this.getNodeParameter('keyType', i) as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.WalletNew',
            params: [keyType],
            id: Date.now() + i,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          
          if (result.error) {
            throw new NodeApiError(this.getNode(), result.error, {
              message: `Filecoin API Error: ${result.error.message}`,
            });
          }

          result = { address: result.result };
          break;
        }

        case 'walletList': {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.WalletList',
            params: [],
            id: Date.now() + i,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          
          if (result.error) {
            throw new NodeApiError(this.getNode(), result.error, {
              message: `Filecoin API Error: ${result.error.message}`,
            });
          }

          result = { addresses: result.result };
          break;
        }

        case 'walletBalance': {
          const address = this.getNodeParameter('address', i) as string;

          // Validate Filecoin address format
          if (!validateFilecoinAddress(address)) {
            throw new NodeOperationError(
              this.getNode(),
              `Invalid Filecoin address format: ${address}. Must be f0, f1, f2, f3, or f4 format.`,
            );
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.WalletBalance',
            params: [address],
            id: Date.now() + i,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          
          if (result.error) {
            throw new NodeApiError(this.getNode(), result.error, {
              message: `Filecoin API Error: ${result.error.message}`,
            });
          }

          result = { 
            address: address,
            balance: result.result,
            balanceAttoFIL: result.result,
          };
          break;
        }

        case 'walletSign': {
          const address = this.getNodeParameter('address', i) as string;
          const data = this.getNodeParameter('data', i) as string;

          // Validate Filecoin address format
          if (!validateFilecoinAddress(address)) {
            throw new NodeOperationError(
              this.getNode(),
              `Invalid Filecoin address format: ${address}. Must be f0, f1, f2, f3, or f4 format.`,
            );
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.WalletSign',
            params: [address, Buffer.from(data, 'base64')],
            id: Date.now() + i,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          
          if (result.error) {
            throw new NodeApiError(this.getNode(), result.error, {
              message: `Filecoin API Error: ${result.error.message}`,
            });
          }

          result = {
            address: address,
            data: data,
            signature: result.result,
          };
          break;
        }

        case 'walletDelete': {
          const address = this.getNodeParameter('address', i) as string;

          // Validate Filecoin address format
          if (!validateFilecoinAddress(address)) {
            throw new NodeOperationError(
              this.getNode(),
              `Invalid Filecoin address format: ${address}. Must be f0, f1, f2, f3, or f4 format.`,
            );
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.WalletDelete',
            params: [address],
            id: Date.now() + i,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          
          if (result.error) {
            throw new NodeApiError(this.getNode(), result.error, {
              message: `Filecoin API Error: ${result.error.message}`,
            });
          }

          result = {
            address: address,
            deleted: true,
            result: result.result,
          };
          break;
        }

        default:
          throw new NodeOperationError(
            this.getNode(),
            `Unknown operation: ${operation}`,
          );
      }

      returnData.push({ json: result, pairedItem: { item: i } });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i },
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

function validateFilecoinAddress(address: string): boolean {
  // Validate Filecoin address format (f0, f1, f2, f3, f4)
  const filecoinAddressRegex = /^f[0-4][a-zA-Z0-9]+$/;
  return filecoinAddressRegex.test(address);
}

async function executeMessageOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('filecoinApi') as any;

  function buildJsonRpcRequest(method: string, params: any[]): any {
    return {
      jsonrpc: '2.0',
      method: `Filecoin.${method}`,
      params: params,
      id: Date.now(),
    };
  }

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      let requestBody: any;

      const baseOptions: any = {
        method: 'POST',
        url: credentials.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        json: true,
      };

      switch (operation) {
        case 'mpoolPush': {
          const signedMessage = this.getNodeParameter('signedMessage', i) as any;
          requestBody = buildJsonRpcRequest('MpoolPush', [signedMessage]);
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          result = response.result || response;
          break;
        }
        
        case 'mpoolPending': {
          const tipsetKey = this.getNodeParameter('tipsetKey', i, []) as any;
          requestBody = buildJsonRpcRequest('MpoolPending', [tipsetKey]);
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          result = response.result || response;
          break;
        }
        
        case 'stateWaitMsg': {
          const messageCid = this.getNodeParameter('messageCid', i) as string;
          const confidence = this.getNodeParameter('confidence', i, 5) as number;
          
          requestBody = buildJsonRpcRequest('StateWaitMsg', [
            { '/': messageCid },
            confidence,
            null
          ]);
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          result = response.result || response;
          break;
        }
        
        case 'gasEstimateGasLimit': {
          const message = this.getNodeParameter('message', i) as any;
          const tipsetKey = this.getNodeParameter('tipsetKey', i, null) as any;
          
          requestBody = buildJsonRpcRequest('GasEstimateGasLimit', [
            message,
            tipsetKey
          ]);
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          result = response.result || response;
          break;
        }
        
        case 'stateSearchMsg': {
          const messageCid = this.getNodeParameter('messageCid', i) as string;
          
          requestBody = buildJsonRpcRequest('StateSearchMsg', [
            null,
            { '/': messageCid },
            -1,
            true
          ]);
          
          const options = {
            ...baseOptions,
            body: requestBody,
          };
          
          const response = await this.helpers.httpRequest(options) as any;
          result = response.result || response;
          break;
        }
        
        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      if (result && result.error) {
        throw new NodeApiError(this.getNode(), result.error);
      }

      returnData.push({
        json: {
          operation,
          result,
          timestamp: new Date().toISOString(),
        },
        pairedItem: { item: i },
      });
      
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: {
            error: error.message,
            operation,
            timestamp: new Date().toISOString(),
          },
          pairedItem: { item: i },
        });
      } else {
        if (error.response && error.response.body) {
          throw new NodeApiError(this.getNode(), error.response.body);
        }
        throw new NodeOperationError(this.getNode(), error.message);
      }
    }
  }

  return returnData;
}

async function executeStorageOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('filecoinApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      const baseUrl = credentials.baseUrl || 'https://api.node.glif.io/rpc/v0';
      
      const baseOptions: any = {
        method: 'POST',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        json: true,
      };

      switch (operation) {
        case 'clientListDeals': {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientListDeals',
            params: [],
            id: 1,
          };

          const options = {
            ...baseOptions,
            body: requestBody,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'clientStartDeal': {
          const dealParams = this.getNodeParameter('dealParams', i) as any;
          let parsedDealParams: any;
          
          try {
            parsedDealParams = typeof dealParams === 'string' ? JSON.parse(dealParams) : dealParams;
          } catch (parseError: any) {
            throw new NodeOperationError(this.getNode(), `Invalid deal parameters JSON: ${parseError.message}`);
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientStartDeal',
            params: [parsedDealParams],
            id: 1,
          };

          const options = {
            ...baseOptions,
            body: requestBody,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'clientGetDealInfo': {
          const dealCid = this.getNodeParameter('dealCid', i) as string;

          if (!dealCid) {
            throw new NodeOperationError(this.getNode(), 'Deal CID is required');
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientGetDealInfo',
            params: [{'/': dealCid}],
            id: 1,
          };

          const options = {
            ...baseOptions,
            body: requestBody,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'stateMinerInfo': {
          const minerAddress = this.getNodeParameter('minerAddress', i) as string;
          const tipsetKey = this.getNodeParameter('tipsetKey', i) as any;

          if (!minerAddress) {
            throw new NodeOperationError(this.getNode(), 'Miner address is required');
          }

          let parsedTipsetKey: any = null;
          if (tipsetKey && tipsetKey !== 'null') {
            try {
              parsedTipsetKey = typeof tipsetKey === 'string' ? JSON.parse(tipsetKey) : tipsetKey;
            } catch (parseError: any) {
              throw new NodeOperationError(this.getNode(), `Invalid tipset key JSON: ${parseError.message}`);
            }
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.StateMinerInfo',
            params: [minerAddress, parsedTipsetKey],
            id: 1,
          };

          const options = {
            ...baseOptions,
            body: requestBody,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'stateListMiners': {
          const tipsetKey = this.getNodeParameter('tipsetKey', i) as any;

          let parsedTipsetKey: any = null;
          if (tipsetKey && tipsetKey !== 'null') {
            try {
              parsedTipsetKey = typeof tipsetKey === 'string' ? JSON.parse(tipsetKey) : tipsetKey;
            } catch (parseError: any) {
              throw new NodeOperationError(this.getNode(), `Invalid tipset key JSON: ${parseError.message}`);
            }
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.StateListMiners',
            params: [parsedTipsetKey],
            id: 1,
          };

          const options = {
            ...baseOptions,
            body: requestBody,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      // Handle JSON-RPC 2.0 response format
      if (result.error) {
        throw new NodeApiError(this.getNode(), result.error, { 
          message: `Filecoin API Error: ${result.error.message}`,
          description: `Code: ${result.error.code}`,
        });
      }

      const responseData = result.result || result;
      returnData.push({ 
        json: responseData, 
        pairedItem: { item: i },
      });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ 
          json: { error: error.message }, 
          pairedItem: { item: i },
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

async function executeSmartContractOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('filecoinApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      
      switch (operation) {
        case 'ethCall': {
          const transaction = this.getNodeParameter('transaction', i) as any;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;
          
          let parsedTransaction: any;
          if (typeof transaction === 'string') {
            parsedTransaction = JSON.parse(transaction);
          } else {
            parsedTransaction = transaction;
          }

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [parsedTransaction, blockNumber],
              id: 1,
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'ethSendRawTransaction': {
          const signedTransaction = this.getNodeParameter('signedTransaction', i) as string;

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_sendRawTransaction',
              params: [signedTransaction],
              id: 1,
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'ethGetTransactionReceipt': {
          const transactionHash = this.getNodeParameter('transactionHash', i) as string;

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [transactionHash],
              id: 1,
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'ethEstimateGas': {
          const transaction = this.getNodeParameter('transaction', i) as any;
          
          let parsedTransaction: any;
          if (typeof transaction === 'string') {
            parsedTransaction = JSON.parse(transaction);
          } else {
            parsedTransaction = transaction;
          }

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_estimateGas',
              params: [parsedTransaction],
              id: 1,
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'ethGetCode': {
          const address = this.getNodeParameter('address', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_getCode',
              params: [address, blockNumber],
              id: 1,
            },
            json: true,
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(
            this.getNode(),
            `Unknown operation: ${operation}`,
            { itemIndex: i }
          );
      }

      // Handle JSON-RPC error responses
      if (result.error) {
        throw new NodeApiError(this.getNode(), result.error, { itemIndex: i });
      }

      returnData.push({ 
        json: result.result || result, 
        pairedItem: { item: i } 
      });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { 
            error: error.message,
            operation: operation,
            itemIndex: i
          },
          pairedItem: { item: i }
        });
      } else {
        if (error instanceof NodeApiError || error instanceof NodeOperationError) {
          throw error;
        }
        throw new NodeApiError(this.getNode(), error, { itemIndex: i });
      }
    }
  }

  return returnData;
}

async function executeIPFSOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('filecoinApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      let requestBody: any;

      switch (operation) {
        case 'clientImport': {
          const importParams = this.getNodeParameter('importParams', i) as any;
          const parsedParams = typeof importParams === 'string' ? JSON.parse(importParams) : importParams;
          
          requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientImport',
            params: [parsedParams],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: requestBody,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'clientRetrieve': {
          const retrieveOrder = this.getNodeParameter('retrieveOrder', i) as any;
          const parsedOrder = typeof retrieveOrder === 'string' ? JSON.parse(retrieveOrder) : retrieveOrder;
          
          requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientRetrieve',
            params: [parsedOrder, null],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: requestBody,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'clientQueryAsk': {
          const peerId = this.getNodeParameter('peerId', i) as string;
          const minerAddress = this.getNodeParameter('minerAddress', i) as string;
          
          const peerInfo = {
            ID: peerId,
            Addrs: [],
          };
          
          requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientQueryAsk',
            params: [peerInfo, minerAddress],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: requestBody,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'clientListImports': {
          requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientListImports',
            params: [],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: requestBody,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'clientRemoveImport': {
          const importID = this.getNodeParameter('importID', i) as number;
          
          requestBody = {
            jsonrpc: '2.0',
            method: 'Filecoin.ClientRemoveImport',
            params: [importID],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: requestBody,
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      if (result.error) {
        throw new NodeApiError(this.getNode(), result, {
          message: `Filecoin API error: ${result.error.message}`,
          description: `Code: ${result.error.code}`,
        });
      }

      returnData.push({ 
        json: result.result || result, 
        pairedItem: { item: i } 
      });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ 
          json: { error: error.message }, 
          pairedItem: { item: i } 
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

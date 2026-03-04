/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Filecoin } from '../nodes/Filecoin/Filecoin.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Filecoin Node', () => {
  let node: Filecoin;

  beforeAll(() => {
    node = new Filecoin();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Filecoin');
      expect(node.description.name).toBe('filecoin');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 6 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(6);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(6);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('Chain Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.node.glif.io/rpc/v0',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  test('should get chain head successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        Cids: [{'/': 'bafy2bzaced...'}],
        Blocks: [],
        Height: 12345,
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getHead';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          method: 'Filecoin.ChainHead',
          params: [],
        }),
      }),
    );
  });

  test('should get block by CID successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        Miner: 'f01234',
        Height: 12345,
        Messages: { '/': 'bafy2bzaced...' },
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getBlock';
      if (param === 'cid') return 'bafy2bzaced123';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          method: 'Filecoin.ChainGetBlock',
          params: [{ '/': 'bafy2bzaced123' }],
        }),
      }),
    );
  });

  test('should get tipset by height successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        Cids: [{'/': 'bafy2bzaced...'}],
        Blocks: [],
        Height: 1000,
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getTipsetByHeight';
      if (param === 'height') return 1000;
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          method: 'Filecoin.ChainGetTipSetByHeight',
          params: [1000, null],
        }),
      }),
    );
  });

  test('should handle API errors', async () => {
    const mockErrorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Block not found',
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getBlock';
      if (param === 'cid') return 'invalid-cid';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockErrorResponse);

    await expect(
      executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]),
    ).rejects.toThrow('Filecoin API Error: Block not found');
  });

  test('should handle continue on fail', async () => {
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getBlock';
      if (param === 'cid') return 'invalid-cid';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual({ error: 'Network error' });
  });
});

describe('Wallet Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.node.glif.io/rpc/v0',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('walletNew operation', () => {
    it('should create a new wallet address successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletNew';
        if (param === 'keyType') return 'secp256k1';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        result: 'f1test123address',
        id: 123,
      });

      const result = await executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({
        address: 'f1test123address',
      });
    });

    it('should handle API errors', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletNew';
        if (param === 'keyType') return 'secp256k1';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        error: { code: -1, message: 'Invalid key type' },
        id: 123,
      });

      await expect(
        executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }])
      ).rejects.toThrow();
    });
  });

  describe('walletList operation', () => {
    it('should list wallet addresses successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletList';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        result: ['f1test123address', 'f2test456address'],
        id: 123,
      });

      const result = await executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({
        addresses: ['f1test123address', 'f2test456address'],
      });
    });
  });

  describe('walletBalance operation', () => {
    it('should get wallet balance successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletBalance';
        if (param === 'address') return 'f1test123address';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        result: '1000000000000000000',
        id: 123,
      });

      const result = await executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({
        address: 'f1test123address',
        balance: '1000000000000000000',
        balanceAttoFIL: '1000000000000000000',
      });
    });

    it('should validate address format', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletBalance';
        if (param === 'address') return 'invalid-address';
        return undefined;
      });

      await expect(
        executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }])
      ).rejects.toThrow('Invalid Filecoin address format');
    });
  });

  describe('walletSign operation', () => {
    it('should sign data successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletSign';
        if (param === 'address') return 'f1test123address';
        if (param === 'data') return 'dGVzdCBkYXRh';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        result: {
          Type: 1,
          Data: 'signature-data',
        },
        id: 123,
      });

      const result = await executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({
        address: 'f1test123address',
        data: 'dGVzdCBkYXRh',
        signature: {
          Type: 1,
          Data: 'signature-data',
        },
      });
    });
  });

  describe('walletDelete operation', () => {
    it('should delete wallet successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'walletDelete';
        if (param === 'address') return 'f1test123address';
        return undefined;
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        result: null,
        id: 123,
      });

      const result = await executeWalletOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({
        address: 'f1test123address',
        deleted: true,
        result: null,
      });
    });
  });
});

describe('Message Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.node.glif.io/rpc/v0',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  test('should send message to mempool successfully', async () => {
    const signedMessage = {
      Message: {
        To: 'f1test',
        From: 'f1sender',
        Value: '0',
        Method: 0,
        Params: '',
        GasLimit: 1000000,
        GasFeeCap: '1000000000',
        GasPremium: '100000000',
        Nonce: 0,
      },
      Signature: 'test-signature',
    };

    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('mpoolPush')
      .mockReturnValueOnce(signedMessage);

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { '/': 'bafy2bzacedtest' },
    });

    const result = await executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.operation).toBe('mpoolPush');
    expect(result[0].json.result).toEqual({ '/': 'bafy2bzacedtest' });
  });

  test('should get pending messages successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('mpoolPending')
      .mockReturnValueOnce([]);

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: [],
    });

    const result = await executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.operation).toBe('mpoolPending');
    expect(result[0].json.result).toEqual([]);
  });

  test('should wait for message confirmation successfully', async () => {
    const messageCid = 'bafy2bzacedtest';
    const confidence = 5;

    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('stateWaitMsg')
      .mockReturnValueOnce(messageCid)
      .mockReturnValueOnce(confidence);

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: {
        Message: { '/': messageCid },
        Receipt: { ExitCode: 0, Return: null, GasUsed: 500000 },
        TipSet: { Height: 100000 },
      },
    });

    const result = await executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.operation).toBe('stateWaitMsg');
    expect(result[0].json.result.Receipt.ExitCode).toBe(0);
  });

  test('should estimate gas limit successfully', async () => {
    const message = {
      To: 'f1test',
      From: 'f1sender',
      Value: '0',
      Method: 0,
      Params: '',
    };

    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('gasEstimateGasLimit')
      .mockReturnValueOnce(message)
      .mockReturnValueOnce(null);

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: 1000000,
    });

    const result = await executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.operation).toBe('gasEstimateGasLimit');
    expect(result[0].json.result).toBe(1000000);
  });

  test('should search message by CID successfully', async () => {
    const messageCid = 'bafy2bzacedtest';

    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('stateSearchMsg')
      .mockReturnValueOnce(messageCid);

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: {
        Message: { '/': messageCid },
        TipSet: { Height: 100000 },
        Receipt: { ExitCode: 0 },
      },
    });

    const result = await executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.operation).toBe('stateSearchMsg');
    expect(result[0].json.result.Message['/']).toBe(messageCid);
  });

  test('should handle API errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('mpoolPush')
      .mockReturnValueOnce({});

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
    expect(result[0].json.operation).toBe('mpoolPush');
  });

  test('should throw error for unknown operation', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('unknownOperation');

    await expect(
      executeMessageOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Unknown operation: unknownOperation');
  });
});

describe('Storage Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.node.glif.io/rpc/v0',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  it('should list storage deals successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: [
        {
          ProposalCid: { '/': 'bafk2bzacectest' },
          State: 1,
          Message: '',
          Provider: 'f01234',
        },
      ],
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'clientListDeals';
      return null;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeStorageOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.node.glif.io/rpc/v0',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key',
      },
      json: true,
      body: {
        jsonrpc: '2.0',
        method: 'Filecoin.ClientListDeals',
        params: [],
        id: 1,
      },
    });
  });

  it('should start storage deal successfully', async () => {
    const mockDealParams = {
      Data: { Root: { '/': 'bafk2bzacectest' } },
      Wallet: 'f1abc123',
      Miner: 'f01234',
      EpochPrice: '1000',
      MinBlocksDuration: 518400,
    };

    const mockResponse = {
      jsonrpc: '2.0',
      result: { '/': 'bafk2bzacectest123' },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'clientStartDeal';
      if (param === 'dealParams') return JSON.stringify(mockDealParams);
      return null;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeStorageOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
  });

  it('should get deal information successfully', async () => {
    const mockDealCid = 'bafk2bzacectest';
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        ProposalCid: { '/': mockDealCid },
        State: 1,
        Message: '',
        Provider: 'f01234',
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'clientGetDealInfo';
      if (param === 'dealCid') return mockDealCid;
      return null;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeStorageOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
  });

  it('should get miner information successfully', async () => {
    const mockMinerAddress = 'f01234';
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        Owner: 'f1abc123',
        Worker: 'f1def456',
        PeerId: '12D3KooW...',
        SectorSize: 34359738368,
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'stateMinerInfo';
      if (param === 'minerAddress') return mockMinerAddress;
      if (param === 'tipsetKey') return 'null';
      return null;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeStorageOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
  });

  it('should list all miners successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: ['f01234', 'f05678', 'f09012'],
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'stateListMiners';
      if (param === 'tipsetKey') return 'null';
      return null;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const items = [{ json: {} }];
    const result = await executeStorageOperations.call(mockExecuteFunctions, items);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
  });

  it('should handle API errors correctly', async () => {
    const mockError = {
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params',
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'clientListDeals';
      return null;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockError);

    const items = [{ json: {} }];

    await expect(
      executeStorageOperations.call(mockExecuteFunctions, items)
    ).rejects.toThrow('Filecoin API Error: Invalid params');
  });

  it('should handle invalid JSON parameters', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'clientStartDeal';
      if (param === 'dealParams') return 'invalid json';
      return null;
    });

    const items = [{ json: {} }];

    await expect(
      executeStorageOperations.call(mockExecuteFunctions, items)
    ).rejects.toThrow('Invalid deal parameters JSON');
  });
});

describe('SmartContract Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.node.glif.io/rpc/v0',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('ethCall operation', () => {
    it('should call smart contract method successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x0000000000000000000000000000000000000000000000000000000000000020',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethCall';
        if (paramName === 'transaction') return { to: '0x123', data: '0x456' };
        if (paramName === 'blockNumber') return 'latest';
        return '';
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const items = [{ json: {} }];
      const result = await executeSmartContractOperations.call(mockExecuteFunctions, items);

      expect(result).toHaveLength(1);
      expect(result[0].json).toBe(mockResponse.result);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.node.glif.io/rpc/v0',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        body: {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: '0x123', data: '0x456' }, 'latest'],
          id: 1,
        },
        json: true,
      });
    });

    it('should handle JSON-RPC error response', async () => {
      const mockErrorResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'execution reverted',
        },
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethCall';
        if (paramName === 'transaction') return { to: '0x123', data: '0x456' };
        if (paramName === 'blockNumber') return 'latest';
        return '';
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockErrorResponse);

      const items = [{ json: {} }];

      await expect(
        executeSmartContractOperations.call(mockExecuteFunctions, items)
      ).rejects.toThrow();
    });
  });

  describe('ethSendRawTransaction operation', () => {
    it('should send raw transaction successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567890abcdef',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethSendRawTransaction';
        if (paramName === 'signedTransaction') return '0xf86c808504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a0';
        return '';
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const items = [{ json: {} }];
      const result = await executeSmartContractOperations.call(mockExecuteFunctions, items);

      expect(result).toHaveLength(1);
      expect(result[0].json).toBe(mockResponse.result);
    });
  });

  describe('ethGetTransactionReceipt operation', () => {
    it('should get transaction receipt successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          transactionHash: '0x123',
          status: '0x1',
          gasUsed: '0x5208',
        },
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethGetTransactionReceipt';
        if (paramName === 'transactionHash') return '0x123';
        return '';
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const items = [{ json: {} }];
      const result = await executeSmartContractOperations.call(mockExecuteFunctions, items);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse.result);
    });
  });

  describe('ethEstimateGas operation', () => {
    it('should estimate gas successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x5208',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethEstimateGas';
        if (paramName === 'transaction') return { to: '0x123', data: '0x456' };
        return '';
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const items = [{ json: {} }];
      const result = await executeSmartContractOperations.call(mockExecuteFunctions, items);

      expect(result).toHaveLength(1);
      expect(result[0].json).toBe(mockResponse.result);
    });
  });

  describe('ethGetCode operation', () => {
    it('should get contract code successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x608060405234801561001057600080fd5b50',
      };

      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethGetCode';
        if (paramName === 'address') return '0x123';
        if (paramName === 'blockNumber') return 'latest';
        return '';
      });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const items = [{ json: {} }];
      const result = await executeSmartContractOperations.call(mockExecuteFunctions, items);

      expect(result).toHaveLength(1);
      expect(result[0].json).toBe(mockResponse.result);
    });
  });

  describe('error handling', () => {
    it('should continue on fail when configured', async () => {
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);
      mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
        if (paramName === 'operation') return 'ethCall';
        return '';
      });
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

      const items = [{ json: {} }];
      const result = await executeSmartContractOperations.call(mockExecuteFunctions, items);

      expect(result).toHaveLength(1);
      expect(result[0].json.error).toBe('Network error');
    });
  });
});

describe('IPFS Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.node.glif.io/rpc/v0',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  test('clientImport should import data successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        Key: 'bafkreih...',
        Root: 'bafkreih...',
        ImportID: 1,
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      if (name === 'operation') return 'clientImport';
      if (name === 'importParams') return '{"Path": "/test/file", "IsCAR": false}';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeIPFSOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.node.glif.io/rpc/v0',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key',
      },
      body: {
        jsonrpc: '2.0',
        method: 'Filecoin.ClientImport',
        params: [{ Path: '/test/file', IsCAR: false }],
        id: 1,
      },
      json: true,
    });
  });

  test('clientRetrieve should retrieve data successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        DealID: 12345,
        Status: 'Retrieved',
      },
      id: 1,
    };

    const retrieveOrder = {
      Root: 'bafkreih123',
      Piece: null,
      Size: 1024,
      Total: '1000000',
      Client: 'f3abc123',
      Provider: 'f01000',
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      if (name === 'operation') return 'clientRetrieve';
      if (name === 'retrieveOrder') return JSON.stringify(retrieveOrder);
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeIPFSOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
  });

  test('clientQueryAsk should query ask price successfully', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      result: {
        Ask: {
          Price: '1000000',
          VerifiedPrice: '500000',
          MinPieceSize: 256,
          MaxPieceSize: 34359738368,
          Miner: 'f01000',
          Timestamp: 1640995200,
          Expiry: 1641081600,
        },
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      if (name === 'operation') return 'clientQueryAsk';
      if (name === 'peerId') return '12D3KooWTest';
      if (name === 'minerAddress') return 'f01000';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeIPFSOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse.result);
  });

  test('should handle API errors correctly', async () => {
    const mockErrorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params',
      },
      id: 1,
    };

    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      if (name === 'operation') return 'clientImport';
      if (name === 'importParams') return '{"Path": ""}';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockErrorResponse);

    await expect(
      executeIPFSOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Filecoin API error: Invalid params');
  });

  test('should handle network errors with continueOnFail', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((name: string) => {
      if (name === 'operation') return 'clientListImports';
      return undefined;
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeIPFSOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual({ error: 'Network error' });
  });
});
});

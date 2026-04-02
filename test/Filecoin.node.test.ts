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
        apiKey: 'test-key',
        baseUrl: 'https://api.node.glif.io/rpc/v1'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      },
    };
  });

  test('getHead operation should return chain head', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getHead');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { Height: 123456, Cids: [{ '/': 'bafy123' }] },
      id: 1
    });

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);
    expect(result[0].json.result.Height).toBe(123456);
  });

  test('getTipSetByHeight operation should return tipset at height', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getTipSetByHeight')
      .mockReturnValueOnce(100000)
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { Height: 100000, Cids: [{ '/': 'bafy456' }] },
      id: 1
    });

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);
    expect(result[0].json.result.Height).toBe(100000);
  });

  test('getBlock operation should return block data', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getBlock')
      .mockReturnValueOnce('bafy123abc');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { Height: 123456, Miner: 'f01234' },
      id: 1
    });

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);
    expect(result[0].json.result.Miner).toBe('f01234');
  });

  test('should handle API errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getHead');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeChainOperations.call(mockExecuteFunctions, [{ json: {} }]);
    expect(result[0].json.error).toBe('API Error');
  });
});

describe('Actor Resource', () => {
  let mockExecuteFunctions: any;
  
  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://api.node.glif.io/rpc/v1' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      },
    };
  });

  it('should get actor state successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getActor')
      .mockReturnValueOnce('f01234')
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: {
        Code: { '/': 'bafk2bzacea...' },
        Head: { '/': 'bafy2bzacea...' },
        Nonce: 0,
        Balance: '1000000000000000000'
      },
      id: 1
    });

    const result = await executeActorOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.node.glif.io/rpc/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'Filecoin.StateGetActor',
        params: ['f01234', null],
        id: 1
      }),
      json: true
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBeDefined();
  });

  it('should handle get actor errors', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getActor')
      .mockReturnValueOnce('invalid-address')
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Invalid actor address'));

    const result = await executeActorOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('Invalid actor address');
  });

  it('should list actors successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('listActors')
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: {
        'f01': { Code: { '/': 'bafk2bzacea...' }, Head: { '/': 'bafy2bzacea...' }, Nonce: 0, Balance: '1000000000000000000' }
      },
      id: 1
    });

    const result = await executeActorOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.node.glif.io/rpc/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'Filecoin.StateListActors',
        params: [null],
        id: 1
      }),
      json: true
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBeDefined();
  });

  it('should get account key successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getAccountKey')
      .mockReturnValueOnce('f01234')
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: 'f3abc123...',
      id: 1
    });

    const result = await executeActorOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('f3abc123...');
  });

  it('should lookup ID successfully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('lookupId')
      .mockReturnValueOnce('f3abc123...')
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: 'f01234',
      id: 1
    });

    const result = await executeActorOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('f01234');
  });

  it('should call method successfully', async () => {
    const message = {
      To: 'f01234',
      From: 'f05678',
      Value: '0',
      Method: 0,
      Params: null
    };
    
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('callMethod')
      .mockReturnValueOnce(message)
      .mockReturnValueOnce('');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: {
        MsgRct: {
          ExitCode: 0,
          Return: null,
          GasUsed: 1000
        }
      },
      id: 1
    });

    const result = await executeActorOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://api.node.glif.io/rpc/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'Filecoin.StateCall',
        params: [message, null],
        id: 1
      }),
      json: true
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result.MsgRct.ExitCode).toBe(0);
  });
});

describe('Message Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				baseUrl: 'https://api.node.glif.io/rpc/v1',
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

	describe('submitMessage', () => {
		it('should submit a signed message successfully', async () => {
			const mockSignedMessage = {
				Message: {
					To: 'f1test',
					From: 'f1sender',
					Nonce: 0,
					Value: '1000000000000000000',
					Method: 0,
					Params: '',
					GasLimit: 1000000,
					GasFeeCap: '1000000000',
					GasPremium: '100000000',
				},
				Signature: { Type: 1, Data: 'mock-signature' },
			};

			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('submitMessage')
				.mockReturnValueOnce(mockSignedMessage);
			
			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
				jsonrpc: '2.0',
				result: { '/': 'bafy2bzaced...' },
				id: 123,
			});

			const result = await executeMessageOperations.call(
				mockExecuteFunctions,
				[{ json: {} }],
			);

			expect(result).toHaveLength(1);
			expect(result[0].json.result).toEqual({ '/': 'bafy2bzaced...' });
		});

		it('should handle submitMessage errors', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('submitMessage')
				.mockReturnValueOnce({});
			mockExecuteFunctions.continueOnFail.mockReturnValue(true);
			mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Invalid message'));

			const result = await executeMessageOperations.call(
				mockExecuteFunctions,
				[{ json: {} }],
			);

			expect(result[0].json.error).toBe('Invalid message');
		});
	});

	describe('getPendingMessages', () => {
		it('should get pending messages successfully', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getPendingMessages')
				.mockReturnValueOnce(null);
			
			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
				jsonrpc: '2.0',
				result: [{ Message: {}, Signature: {} }],
				id: 123,
			});

			const result = await executeMessageOperations.call(
				mockExecuteFunctions,
				[{ json: {} }],
			);

			expect(result).toHaveLength(1);
			expect(Array.isArray(result[0].json.result)).toBe(true);
		});
	});

	describe('getNonce', () => {
		it('should get nonce successfully', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getNonce')
				.mockReturnValueOnce('f1test123');
			
			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
				jsonrpc: '2.0',
				result: 42,
				id: 123,
			});

			const result = await executeMessageOperations.call(
				mockExecuteFunctions,
				[{ json: {} }],
			);

			expect(result[0].json.result).toBe(42);
		});
	});

	describe('searchMessage', () => {
		it('should search message successfully', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('searchMessage')
				.mockReturnValueOnce('bafy2bzaced123');
			
			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
				jsonrpc: '2.0',
				result: { Message: {}, Receipt: {} },
				id: 123,
			});

			const result = await executeMessageOperations.call(
				mockExecuteFunctions,
				[{ json: {} }],
			);

			expect(result[0].json.result).toHaveProperty('Message');
			expect(result[0].json.result).toHaveProperty('Receipt');
		});
	});

	describe('getReceipt', () => {
		it('should get receipt successfully', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getReceipt')
				.mockReturnValueOnce('bafy2bzaced123')
				.mockReturnValueOnce(null);
			
			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
				jsonrpc: '2.0',
				result: { ExitCode: 0, Return: '', GasUsed: 500000 },
				id: 123,
			});

			const result = await executeMessageOperations.call(
				mockExecuteFunctions,
				[{ json: {} }],
			);

			expect(result[0].json.result.ExitCode).toBe(0);
		});
	});
});

describe('Wallet Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-key',
        baseUrl: 'https://api.node.glif.io/rpc/v1'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      },
    };
  });

  describe('getBalance operation', () => {
    it('should get wallet balance successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getBalance')
        .mockReturnValueOnce('f1test123');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: '1000000000000000000'
      });

      const result = await executeWalletOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json).toBe('1000000000000000000');
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.node.glif.io/rpc/v1',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        },
        json: true,
        body: {
          jsonrpc: '2.0',
          method: 'Filecoin.WalletBalance',
          params: ['f1test123'],
          id: 1
        }
      });
    });

    it('should handle getBalance error', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getBalance')
        .mockReturnValueOnce('f1test123');

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeWalletOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json.error).toBe('API Error');
    });
  });

  describe('createAddress operation', () => {
    it('should create new wallet address successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('createAddress')
        .mockReturnValueOnce('secp256k1');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: 'f1newaddress123'
      });

      const result = await executeWalletOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json).toBe('f1newaddress123');
    });
  });

  describe('listAddresses operation', () => {
    it('should list wallet addresses successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('listAddresses');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: ['f1addr1', 'f1addr2']
      });

      const result = await executeWalletOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json).toEqual(['f1addr1', 'f1addr2']);
    });
  });

  describe('checkAddress operation', () => {
    it('should check if wallet has address successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('checkAddress')
        .mockReturnValueOnce('f1test123');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: true
      });

      const result = await executeWalletOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json).toBe(true);
    });
  });

  describe('signMessage operation', () => {
    it('should sign message successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('signMessage')
        .mockReturnValueOnce('f1test123')
        .mockReturnValueOnce('Hello World');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: {
          Type: 1,
          Data: 'signature_data'
        }
      });

      const result = await executeWalletOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json).toEqual({
        Type: 1,
        Data: 'signature_data'
      });
    });
  });
});

describe('Storage Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-key',
        baseUrl: 'https://api.node.glif.io/rpc/v1'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      }
    };
  });

  test('getStorageDeals should get all storage deals', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getStorageDeals')
      .mockReturnValueOnce('');

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { '1': { Proposal: { PieceSize: 1024 } } },
      id: 1
    });

    const result = await executeStorageOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBeDefined();
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.node.glif.io/rpc/v1'
      })
    );
  });

  test('getMarketBalance should get market balance for address', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMarketBalance')
      .mockReturnValueOnce('f01234')
      .mockReturnValueOnce('');

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { Escrow: '1000000', Locked: '500000' },
      id: 1
    });

    const result = await executeStorageOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBeDefined();
  });

  test('getMinerInfo should get miner information', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMinerInfo')
      .mockReturnValueOnce('f01000')
      .mockReturnValueOnce('');

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { Owner: 'f01234', Worker: 'f05678', SectorSize: 34359738368 },
      id: 1
    });

    const result = await executeStorageOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json.result.SectorSize).toBe(34359738368);
  });

  test('getMinerPower should get miner power', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMinerPower')
      .mockReturnValueOnce('f01000')
      .mockReturnValueOnce('');

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: { MinerPower: { RawBytePower: '1073741824' }, TotalPower: { RawBytePower: '1099511627776' } },
      id: 1
    });

    const result = await executeStorageOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json.result.MinerPower).toBeDefined();
  });

  test('getMinerDeadlines should get miner deadlines', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getMinerDeadlines')
      .mockReturnValueOnce('f01000')
      .mockReturnValueOnce('');

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      result: [{ PostSubmissions: [], DisputableProofCount: 0 }],
      id: 1
    });

    const result = await executeStorageOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0].json.result)).toBe(true);
  });

  test('should handle API errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getStorageDeals');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeStorageOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
  });

  test('should throw error for unknown operation', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('unknownOperation');

    await expect(
      executeStorageOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Unknown operation: unknownOperation');
  });
});

describe('Network Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				baseUrl: 'https://api.node.glif.io/rpc/v1',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
			},
		};
	});

	describe('getPeers operation', () => {
		it('should get connected peers successfully', async () => {
			const mockResponse = {
				jsonrpc: '2.0',
				result: [
					{
						Addr: '/ip4/192.168.1.1/tcp/1234',
						Peer: '12D3KooWExample',
						Latency: '10ms'
					}
				],
				id: 1
			};

			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getPeers');

			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

			const result = await executeNetworkOperations.call(
				mockExecuteFunctions,
				[{ json: {} }]
			);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual(mockResponse.result);
		});

		it('should handle API errors', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getPeers');

			mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(
				new Error('Network error')
			);

			await expect(
				executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }])
			).rejects.toThrow('Network error');
		});
	});

	describe('connectPeer operation', () => {
		it('should connect to peer successfully', async () => {
			const mockResponse = {
				jsonrpc: '2.0',
				result: null,
				id: 1
			};

			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('connectPeer')
				.mockReturnValueOnce('/ip4/192.168.1.1/tcp/1234/p2p/12D3KooWExample');

			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

			const result = await executeNetworkOperations.call(
				mockExecuteFunctions,
				[{ json: {} }]
			);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual(mockResponse.result);
		});
	});

	describe('getListeningAddresses operation', () => {
		it('should get listening addresses successfully', async () => {
			const mockResponse = {
				jsonrpc: '2.0',
				result: {
					Addrs: ['/ip4/0.0.0.0/tcp/1234', '/ip6/::/tcp/1234'],
					ID: '12D3KooWExample'
				},
				id: 1
			};

			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getListeningAddresses');

			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

			const result = await executeNetworkOperations.call(
				mockExecuteFunctions,
				[{ json: {} }]
			);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual(mockResponse.result);
		});
	});

	describe('getSyncStatus operation', () => {
		it('should get sync status successfully', async () => {
			const mockResponse = {
				jsonrpc: '2.0',
				result: [
					{
						Base: [{ '/': 'bafy2bzaced...' }],
						Target: [{ '/': 'bafy2bzaced...' }],
						Height: 2845123,
						Stage: 4
					}
				],
				id: 1
			};

			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getSyncStatus');

			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

			const result = await executeNetworkOperations.call(
				mockExecuteFunctions,
				[{ json: {} }]
			);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual(mockResponse.result);
		});
	});

	describe('getVersion operation', () => {
		it('should get node version successfully', async () => {
			const mockResponse = {
				jsonrpc: '2.0',
				result: {
					Version: '1.20.4',
					APIVersion: 0x011004,
					BlockDelay: 30
				},
				id: 1
			};

			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('getVersion');

			mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

			const result = await executeNetworkOperations.call(
				mockExecuteFunctions,
				[{ json: {} }]
			);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual(mockResponse.result);
		});
	});
});
});

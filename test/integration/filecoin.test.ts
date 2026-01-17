/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { createLotusClient } from '../../nodes/Filecoin/transport/lotusClient';

describe('Filecoin Integration Tests', () => {
	const CALIBRATION_RPC = 'https://api.calibration.node.glif.io/rpc/v1';

	describe('LotusClient', () => {
		it('should create a client', () => {
			const client = createLotusClient(CALIBRATION_RPC);
			expect(client).toBeDefined();
		});

		it('should get chain head', async () => {
			const client = createLotusClient(CALIBRATION_RPC);
			const head = await client.getChainHead();
			expect(head).toBeDefined();
			expect(head.Height).toBeGreaterThan(0);
		}, 30000);

		it('should get network version', async () => {
			const client = createLotusClient(CALIBRATION_RPC);
			const version = await client.version();
			expect(version).toBeDefined();
			expect(version.Version).toBeDefined();
		}, 30000);

		it('should get wallet balance for known address', async () => {
			const client = createLotusClient(CALIBRATION_RPC);
			// Calibration faucet address
			const balance = await client.getWalletBalance('f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za');
			expect(balance).toBeDefined();
		}, 30000);
	});
});

/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { attoFilToFil, filToAttoFil, formatFil } from '../../nodes/Filecoin/utils/unitConverter';
import { validateAddress, getAddressProtocol } from '../../nodes/Filecoin/utils/addressUtils';
import { validateCid, formatCid } from '../../nodes/Filecoin/utils/cidUtils';

describe('Unit Converter Utils', () => {
	describe('attoFilToFil', () => {
		it('should convert attoFIL to FIL', () => {
			expect(attoFilToFil('1000000000000000000')).toBe('1');
			expect(attoFilToFil('500000000000000000')).toBe('0.5');
		});

		it('should handle zero', () => {
			expect(attoFilToFil('0')).toBe('0');
		});
	});

	describe('filToAttoFil', () => {
		it('should convert FIL to attoFIL', () => {
			expect(filToAttoFil('1')).toBe('1000000000000000000');
			expect(filToAttoFil('0.5')).toBe('500000000000000000');
		});
	});

	describe('formatFil', () => {
		it('should format FIL amounts', () => {
			expect(formatFil('1000000000000000000')).toContain('FIL');
		});
	});
});

describe('Address Utils', () => {
	describe('validateAddress', () => {
		it('should validate f1 addresses', () => {
			expect(validateAddress('f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za')).toBe(true);
		});

		it('should validate f0 addresses', () => {
			expect(validateAddress('f01234')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(validateAddress('invalid')).toBe(false);
		});
	});

	describe('getAddressProtocol', () => {
		it('should return correct protocol', () => {
			expect(getAddressProtocol('f01234')).toBe(0);
			expect(getAddressProtocol('f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za')).toBe(1);
		});
	});
});

describe('CID Utils', () => {
	describe('validateCid', () => {
		it('should validate CIDv0', () => {
			expect(validateCid('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(true);
		});

		it('should validate CIDv1', () => {
			expect(validateCid('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).toBe(true);
		});

		it('should reject invalid CIDs', () => {
			expect(validateCid('invalid')).toBe(false);
		});
	});

	describe('formatCid', () => {
		it('should format CID correctly', () => {
			const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
			expect(formatCid(cid)).toBe(cid);
		});
	});
});

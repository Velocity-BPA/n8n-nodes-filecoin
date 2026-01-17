/**
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/test/**/*.test.ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	collectCoverageFrom: [
		'nodes/**/*.ts',
		'credentials/**/*.ts',
		'!**/node_modules/**',
		'!**/dist/**',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	verbose: true,
	testTimeout: 30000,
};

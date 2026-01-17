/**
 * Multisig Actions
 * Operations for Filecoin multisig wallets
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { validateAddress } from '../../utils/addressUtils';
import { attoFilToFil, formatFil, filToAttoFil } from '../../utils/unitConverter';

export const multisigProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['multisig'],
			},
		},
		options: [
			{
				name: 'Create Multisig',
				value: 'create',
				description: 'Create a new multisig wallet',
				action: 'Create multisig',
			},
			{
				name: 'Get Multisig Info',
				value: 'getInfo',
				description: 'Get multisig wallet information',
				action: 'Get multisig info',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get multisig wallet balance',
				action: 'Get balance',
			},
			{
				name: 'Propose Transaction',
				value: 'propose',
				description: 'Propose a transaction from multisig',
				action: 'Propose transaction',
			},
			{
				name: 'Approve Transaction',
				value: 'approve',
				description: 'Approve a pending transaction',
				action: 'Approve transaction',
			},
			{
				name: 'Cancel Transaction',
				value: 'cancel',
				description: 'Cancel a pending transaction',
				action: 'Cancel transaction',
			},
			{
				name: 'Get Pending Transactions',
				value: 'getPending',
				description: 'List pending transactions',
				action: 'Get pending transactions',
			},
			{
				name: 'Get Vested Funds',
				value: 'getVested',
				description: 'Get vested funds amount',
				action: 'Get vested funds',
			},
			{
				name: 'Add Signer',
				value: 'addSigner',
				description: 'Propose adding a new signer',
				action: 'Add signer',
			},
			{
				name: 'Remove Signer',
				value: 'removeSigner',
				description: 'Propose removing a signer',
				action: 'Remove signer',
			},
			{
				name: 'Change Threshold',
				value: 'changeThreshold',
				description: 'Propose changing the approval threshold',
				action: 'Change threshold',
			},
		],
		default: 'getInfo',
	},
	{
		displayName: 'Multisig Address',
		name: 'multisigAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Multisig wallet address',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['getInfo', 'getBalance', 'propose', 'approve', 'cancel', 'getPending', 'getVested', 'addSigner', 'removeSigner', 'changeThreshold'],
			},
		},
	},
	{
		displayName: 'Signers',
		name: 'signers',
		type: 'string',
		default: '',
		required: true,
		description: 'Comma-separated list of signer addresses',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Threshold',
		name: 'threshold',
		type: 'number',
		default: 2,
		required: true,
		description: 'Number of required approvals',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'New Threshold',
		name: 'newThreshold',
		type: 'number',
		default: 2,
		required: true,
		description: 'New approval threshold',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['changeThreshold'],
			},
		},
	},
	{
		displayName: 'Initial Balance (FIL)',
		name: 'initialBalance',
		type: 'string',
		default: '0',
		description: 'Initial balance to send to multisig',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Unlock Duration (Epochs)',
		name: 'unlockDuration',
		type: 'number',
		default: 0,
		description: 'Vesting unlock duration in epochs (0 for immediate)',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Start Epoch',
		name: 'startEpoch',
		type: 'number',
		default: 0,
		description: 'Vesting start epoch (0 for current)',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Destination Address',
		name: 'destination',
		type: 'string',
		default: '',
		required: true,
		description: 'Destination address for the transaction',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['propose'],
			},
		},
	},
	{
		displayName: 'Amount (FIL)',
		name: 'amount',
		type: 'string',
		default: '0',
		required: true,
		description: 'Amount to send in FIL',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['propose'],
			},
		},
	},
	{
		displayName: 'Transaction ID',
		name: 'txId',
		type: 'number',
		default: 0,
		required: true,
		description: 'Transaction ID to approve or cancel',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['approve', 'cancel'],
			},
		},
	},
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Address of the signer to add or remove',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['addSigner', 'removeSigner'],
			},
		},
	},
	{
		displayName: 'Increase Threshold',
		name: 'increaseThreshold',
		type: 'boolean',
		default: true,
		description: 'Whether to increase threshold when adding signer',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['addSigner'],
			},
		},
	},
	{
		displayName: 'Decrease Threshold',
		name: 'decreaseThreshold',
		type: 'boolean',
		default: true,
		description: 'Whether to decrease threshold when removing signer',
		displayOptions: {
			show: {
				resource: ['multisig'],
				operation: ['removeSigner'],
			},
		},
	},
];

export async function executeMultisigOperation(
	this: IExecuteFunctions,
	index: number
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('filecoinNetwork');
	
	const lotus = createLotusClient({
		network: credentials.network as string,
		lotusRpcUrl: credentials.lotusRpcUrl as string,
		lotusApiToken: credentials.lotusApiToken as string,
	});
	
	let result: unknown;
	
	switch (operation) {
		case 'create': {
			const signersStr = this.getNodeParameter('signers', index) as string;
			const threshold = this.getNodeParameter('threshold', index) as number;
			const initialBalance = this.getNodeParameter('initialBalance', index) as string;
			const unlockDuration = this.getNodeParameter('unlockDuration', index) as number;
			const startEpoch = this.getNodeParameter('startEpoch', index) as number;
			
			const signers = signersStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
			
			if (signers.length < 2) {
				throw new Error('Multisig requires at least 2 signers');
			}
			
			if (threshold > signers.length) {
				throw new Error('Threshold cannot exceed number of signers');
			}
			
			for (const signer of signers) {
				if (!validateAddress(signer)) {
					throw new Error(`Invalid signer address: ${signer}`);
				}
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			const value = filToAttoFil(initialBalance);
			
			const msgCid = await lotus.msigCreate(
				threshold,
				signers,
				unlockDuration,
				value,
				fromAddress,
				0 // gasLimit - 0 to auto-estimate
			);
			
			result = {
				messageCid: msgCid?.['/'],
				signers,
				threshold,
				initialBalance: `${initialBalance} FIL`,
				unlockDuration,
				startEpoch,
				status: 'pending',
				note: 'Wait for message confirmation to get multisig address',
			};
			break;
		}
		
		case 'getInfo': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const state = await lotus.getStateReadState(multisigAddress, chainHead.Cids);
			
			const msigState = state.State as {
				Signers?: string[];
				NumApprovalsThreshold?: number;
				NextTxnID?: number;
				InitialBalance?: string;
				StartEpoch?: number;
				UnlockDuration?: number;
			};
			
			result = {
				address: multisigAddress,
				balance: attoFilToFil(state.Balance),
				balanceFormatted: `${formatFil(state.Balance)} FIL`,
				signers: msigState.Signers || [],
				signerCount: msigState.Signers?.length || 0,
				threshold: msigState.NumApprovalsThreshold,
				nextTxnId: msigState.NextTxnID,
				initialBalance: msigState.InitialBalance,
				startEpoch: msigState.StartEpoch,
				unlockDuration: msigState.UnlockDuration,
			};
			break;
		}
		
		case 'getBalance': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const [availableBalance, vestedBalance] = await Promise.all([
				lotus.msigGetAvailableBalance(multisigAddress, chainHead.Cids),
				lotus.msigGetVested(multisigAddress, [], chainHead.Cids),
			]);
			
			const totalBalance = await lotus.getWalletBalance(multisigAddress);
			
			result = {
				address: multisigAddress,
				totalBalance: attoFilToFil(totalBalance),
				totalBalanceFormatted: `${formatFil(totalBalance)} FIL`,
				availableBalance: attoFilToFil(availableBalance),
				availableBalanceFormatted: `${formatFil(availableBalance)} FIL`,
				vestedBalance: attoFilToFil(vestedBalance),
				vestedBalanceFormatted: `${formatFil(vestedBalance)} FIL`,
			};
			break;
		}
		
		case 'propose': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			const destination = this.getNodeParameter('destination', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			if (!validateAddress(destination)) {
				throw new Error(`Invalid destination address: ${destination}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			const value = filToAttoFil(amount);
			
			const msgCid = await lotus.msigPropose(
				multisigAddress,
				destination,
				value,
				fromAddress,
				0,
				null
			);
			
			result = {
				messageCid: msgCid?.['/'],
				multisig: multisigAddress,
				destination,
				amount: `${amount} FIL`,
				proposer: fromAddress,
				status: 'proposed',
			};
			break;
		}
		
		case 'approve': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			const txId = this.getNodeParameter('txId', index) as number;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			
			const msgCid = await lotus.msigApprove(
				multisigAddress,
				txId,
				fromAddress
			);
			
			result = {
				messageCid: msgCid?.['/'],
				multisig: multisigAddress,
				txId,
				approver: fromAddress,
				status: 'approval_sent',
			};
			break;
		}
		
		case 'cancel': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			const txId = this.getNodeParameter('txId', index) as number;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			
			const msgCid = await lotus.msigCancel(
				multisigAddress,
				txId,
				fromAddress
			);
			
			result = {
				messageCid: msgCid?.['/'],
				multisig: multisigAddress,
				txId,
				canceller: fromAddress,
				status: 'cancellation_sent',
			};
			break;
		}
		
		case 'getPending': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const pending = await lotus.msigGetPending(multisigAddress, chainHead.Cids);
			
			result = {
				multisig: multisigAddress,
				pendingTransactions: pending?.map((tx: { ID: number; To: string; Value: string; Method: number; Params: unknown; Approved: string[] }) => ({
					id: tx.ID,
					to: tx.To,
					value: attoFilToFil(tx.Value),
					valueFormatted: `${formatFil(tx.Value)} FIL`,
					method: tx.Method,
					params: tx.Params,
					approved: tx.Approved,
					approvalCount: tx.Approved?.length || 0,
				})) || [],
				count: pending?.length || 0,
			};
			break;
		}
		
		case 'getVested': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const vested = await lotus.msigGetVested(multisigAddress, [], chainHead.Cids);
			
			result = {
				multisig: multisigAddress,
				vestedAmount: attoFilToFil(vested),
				vestedAmountFormatted: `${formatFil(vested)} FIL`,
			};
			break;
		}
		
		case 'addSigner': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const increaseThreshold = this.getNodeParameter('increaseThreshold', index) as boolean;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			if (!validateAddress(signerAddress)) {
				throw new Error(`Invalid signer address: ${signerAddress}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			
			const msgCid = await lotus.msigAddSigner(
				multisigAddress,
				fromAddress,
				signerAddress,
				increaseThreshold
			);
			
			result = {
				messageCid: msgCid?.['/'],
				multisig: multisigAddress,
				newSigner: signerAddress,
				increaseThreshold,
				proposer: fromAddress,
				status: 'add_signer_proposed',
			};
			break;
		}
		
		case 'removeSigner': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const decreaseThreshold = this.getNodeParameter('decreaseThreshold', index) as boolean;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			if (!validateAddress(signerAddress)) {
				throw new Error(`Invalid signer address: ${signerAddress}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			
			const msgCid = await lotus.msigRemoveSigner(
				multisigAddress,
				fromAddress,
				signerAddress,
				decreaseThreshold
			);
			
			result = {
				messageCid: msgCid?.['/'],
				multisig: multisigAddress,
				removedSigner: signerAddress,
				decreaseThreshold,
				proposer: fromAddress,
				status: 'remove_signer_proposed',
			};
			break;
		}
		
		case 'changeThreshold': {
			const multisigAddress = this.getNodeParameter('multisigAddress', index) as string;
			const newThreshold = this.getNodeParameter('newThreshold', index) as number;
			
			if (!validateAddress(multisigAddress)) {
				throw new Error(`Invalid multisig address: ${multisigAddress}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			
			// Propose change threshold via msigPropose with method 8 (ChangeNumApprovalsThreshold)
			const msgCid = await lotus.msigPropose(
				multisigAddress,
				multisigAddress, // To itself
				'0',
				fromAddress,
				8, // ChangeNumApprovalsThreshold method
				Buffer.from(JSON.stringify({ NewThreshold: newThreshold })).toString('base64')
			);
			
			result = {
				messageCid: msgCid?.['/'],
				multisig: multisigAddress,
				newThreshold,
				proposer: fromAddress,
				status: 'threshold_change_proposed',
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}

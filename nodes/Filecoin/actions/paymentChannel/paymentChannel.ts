/**
 * Payment Channel Actions
 * Operations for Filecoin payment channels
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { createLotusClient } from '../../transport/lotusClient';
import { validateAddress } from '../../utils/addressUtils';
import { attoFilToFil, formatFil, filToAttoFil } from '../../utils/unitConverter';

export const paymentChannelProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
			},
		},
		options: [
			{
				name: 'Create Channel',
				value: 'create',
				description: 'Create a new payment channel',
				action: 'Create channel',
			},
			{
				name: 'Get Channel Info',
				value: 'getInfo',
				description: 'Get payment channel information',
				action: 'Get channel info',
			},
			{
				name: 'Get Channel Status',
				value: 'getStatus',
				description: 'Get payment channel status',
				action: 'Get channel status',
			},
			{
				name: 'List Channels',
				value: 'list',
				description: 'List all payment channels',
				action: 'List channels',
			},
			{
				name: 'Allocate Lane',
				value: 'allocateLane',
				description: 'Allocate a new lane in the channel',
				action: 'Allocate lane',
			},
			{
				name: 'Create Voucher',
				value: 'createVoucher',
				description: 'Create a payment voucher',
				action: 'Create voucher',
			},
			{
				name: 'Submit Voucher',
				value: 'submitVoucher',
				description: 'Submit a voucher to the channel',
				action: 'Submit voucher',
			},
			{
				name: 'Settle Channel',
				value: 'settle',
				description: 'Initiate channel settlement',
				action: 'Settle channel',
			},
			{
				name: 'Collect Channel',
				value: 'collect',
				description: 'Collect funds after settlement',
				action: 'Collect channel',
			},
		],
		default: 'getInfo',
	},
	{
		displayName: 'Channel Address',
		name: 'channelAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Payment channel address',
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
				operation: ['getInfo', 'getStatus', 'allocateLane', 'createVoucher', 'submitVoucher', 'settle', 'collect'],
			},
		},
	},
	{
		displayName: 'Recipient Address',
		name: 'recipient',
		type: 'string',
		default: '',
		required: true,
		description: 'Recipient address for the payment channel',
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Amount (FIL)',
		name: 'amount',
		type: 'string',
		default: '0',
		required: true,
		description: 'Amount to deposit in the channel',
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
				operation: ['create', 'createVoucher'],
			},
		},
	},
	{
		displayName: 'Lane',
		name: 'lane',
		type: 'number',
		default: 0,
		description: 'Lane number for the voucher',
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
				operation: ['createVoucher'],
			},
		},
	},
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		default: 1,
		description: 'Voucher nonce (must be higher than previous)',
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
				operation: ['createVoucher'],
			},
		},
	},
	{
		displayName: 'Voucher',
		name: 'voucher',
		type: 'string',
		default: '',
		required: true,
		description: 'Signed voucher to submit (base64 encoded)',
		displayOptions: {
			show: {
				resource: ['paymentChannel'],
				operation: ['submitVoucher'],
			},
		},
	},
];

export async function executePaymentChannelOperation(
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
			const recipient = this.getNodeParameter('recipient', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!validateAddress(recipient)) {
				throw new Error(`Invalid recipient address: ${recipient}`);
			}
			
			const fromAddress = await lotus.getWalletDefaultAddress();
			const value = filToAttoFil(amount);
			
			const channelInfo = await lotus.paychGet(fromAddress, recipient, value);
			
			result = {
				channelAddress: channelInfo.Channel,
				waitSentinel: channelInfo.WaitSentinel?.['/'],
				from: fromAddress,
				to: recipient,
				amount: `${amount} FIL`,
				status: 'creating',
				note: 'Use waitSentinel CID to check when channel is ready',
			};
			break;
		}
		
		case 'getInfo': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			const chainHead = await lotus.getChainHead();
			const state = await lotus.getStateReadState(channelAddress, chainHead.Cids);
			
			const channelState = state.State as {
				From?: string;
				To?: string;
				ToSend?: string;
				SettlingAt?: number;
				MinSettleHeight?: number;
				LaneStates?: unknown[];
			};
			
			result = {
				address: channelAddress,
				balance: attoFilToFil(state.Balance),
				balanceFormatted: `${formatFil(state.Balance)} FIL`,
				from: channelState.From,
				to: channelState.To,
				toSend: channelState.ToSend,
				toSendFormatted: `${formatFil(channelState.ToSend || '0')} FIL`,
				settlingAt: channelState.SettlingAt,
				minSettleHeight: channelState.MinSettleHeight,
				laneCount: channelState.LaneStates?.length || 0,
			};
			break;
		}
		
		case 'getStatus': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			const status = await lotus.paychStatus(channelAddress);
			
			result = {
				address: channelAddress,
				controlAddress: status.ControlAddr,
				direction: status.Direction === 1 ? 'outbound' : 'inbound',
			};
			break;
		}
		
		case 'list': {
			const channels = await lotus.paychList();
			
			const channelDetails = await Promise.all(
				(channels || []).map(async (addr: string) => {
					try {
						const status = await lotus.paychStatus(addr);
						return {
							address: addr,
							controlAddress: status.ControlAddr,
							direction: status.Direction === 1 ? 'outbound' : 'inbound',
						};
					} catch {
						return {
							address: addr,
							error: 'Failed to get status',
						};
					}
				})
			);
			
			result = {
				channels: channelDetails,
				count: channels?.length || 0,
			};
			break;
		}
		
		case 'allocateLane': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			const lane = await lotus.paychAllocateLane(channelAddress);
			
			result = {
				channelAddress,
				lane,
				message: `Lane ${lane} allocated successfully`,
			};
			break;
		}
		
		case 'createVoucher': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const lane = this.getNodeParameter('lane', index) as number;
			const nonce = this.getNodeParameter('nonce', index) as number;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			const value = filToAttoFil(amount);
			
			const voucherResult = await lotus.paychVoucherCreate(channelAddress, value, lane);
			
			result = {
				channelAddress,
				voucher: voucherResult.Voucher,
				lane,
				nonce: voucherResult.Voucher?.Nonce || nonce,
				amount: `${amount} FIL`,
				signature: voucherResult.Voucher?.Signature,
			};
			break;
		}
		
		case 'submitVoucher': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			const voucher = this.getNodeParameter('voucher', index) as string;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			// Parse voucher from base64
			let voucherObj;
			try {
				voucherObj = JSON.parse(Buffer.from(voucher, 'base64').toString());
			} catch {
				throw new Error('Invalid voucher format. Expected base64 encoded JSON.');
			}
			
			const submitResult = await lotus.paychVoucherSubmit(channelAddress, voucherObj);
			
			result = {
				channelAddress,
				submitted: true,
				messageCid: submitResult?.['/'],
			};
			break;
		}
		
		case 'settle': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			const msgCid = await lotus.paychSettle(channelAddress);
			
			result = {
				channelAddress,
				messageCid: msgCid?.['/'],
				status: 'settling',
				note: 'Settlement will complete after the settle period',
			};
			break;
		}
		
		case 'collect': {
			const channelAddress = this.getNodeParameter('channelAddress', index) as string;
			
			if (!validateAddress(channelAddress)) {
				throw new Error(`Invalid channel address: ${channelAddress}`);
			}
			
			const msgCid = await lotus.paychCollect(channelAddress);
			
			result = {
				channelAddress,
				messageCid: msgCid?.['/'],
				status: 'collecting',
				note: 'Funds will be transferred after message confirmation',
			};
			break;
		}
		
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
	
	return [{ json: result as INodeExecutionData['json'] }];
}

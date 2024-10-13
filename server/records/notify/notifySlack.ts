/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/**
 * TODO
 * - support multiple user mentions
 */
import axios, { AxiosResponse } from 'axios';
import { NotifyPackage, NotifyType, getMessagePrefixByType, getMessageIconUrlByType } from './notifyShared';
import * as UTIL from '../utils/utils';
import { RateManager, RateManagerConfig, RateManagerResult } from '../utils/rateManager';

//#region TYPES & INTERFACES
// declaring this empty for branding/clarity since it is used
// for instances that are not related to the RateManager
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlackResult extends RateManagerResult {}

interface SlackEntry {
    type: NotifyType,
    channel: string,    // ID of the slack channel
    iconUrl: string     // what icon to use for the message
    subject: string,    // the main subject line. often truncated to 60 chars
    blocks: Array<any>, // blocks array holds the message structure
}

export enum SlackChannel {
    PACKRAT_OPS = 'C07NCJE9FJM',        // packrat-ops: for user focused messages and system updates
    PACKRAT_DEV = 'C07MKBKGNTZ',        // packrat-dev: for testing and development messages
    PACKRAT_SYSTEM = 'C07R86MRPMM',     // packrat-system: for admin only notices
}
//#endregion

export class NotifySlack {
    private static rateManager: RateManager<SlackEntry> | null =  null;
    private static defaultChannel: SlackChannel = SlackChannel.PACKRAT_DEV;

    public static isActive(): boolean {
        // we're initialized if we have a logger running
        return (NotifySlack.rateManager!=null);
    }
    public static configure(env: 'dev' | 'prod', targetRate?: number, burstRate?: number, burstThreshold?: number): SlackResult {

        NotifySlack.defaultChannel = (env=='dev') ? SlackChannel.PACKRAT_DEV : SlackChannel.PACKRAT_OPS;

        // if we want a rate limiter then we build it
        const rmConfig: RateManagerConfig<SlackEntry> = {
            targetRate: targetRate ?? 1,
            burstRate: burstRate ?? 5,
            burstThreshold: burstThreshold ?? 25,
            onPost: NotifySlack.postMessage,
        };

        // if we already have a manager we re-configure it (causes restart). otherwise, we create a new one
        if(NotifySlack.rateManager)
            NotifySlack.rateManager.setConfig(rmConfig);
        else
            NotifySlack.rateManager = new RateManager<SlackEntry>(rmConfig);

        return { success: true, message: 'configured Slack notifier.' };
    }

    //#region UTILS
    private static formatHeaders(): any {
        // we need to sign all requests to the API by including our key in the headers
        const slackToken = 'undefined_secret';
        return {
            headers: {
                'Authorization': `Bearer ${slackToken}`,
                'Content-Type': 'application/json; charset=utf-8',
            }
        };
    }
    public static async cleanChannel(channel?: SlackChannel): Promise<SlackResult> {

        const getMessagesByChannel = async (channel: SlackChannel): Promise<SlackResult> => {
            // TODO: check for valid channel
            try {
                const response = await axios.get('https://slack.com/api/conversations.history', {
                    ...NotifySlack.formatHeaders(),
                    params: {
                        channel,
                    }
                });

                if (response.data.ok)
                    return { success: true, message: 'got slack messages', data: { channel, count: response.data.messages.length, messages: response.data.messages } }; // Return the list of messages
                else
                    return { success: false, message: 'failed to fetch slack messages', data: { error: response.data.error, channel } };

            } catch (error) {
                return { success: false, message: 'failed to fetch slack messages', data: { error: UTIL.getErrorString(error), channel } };
            }
        };
        const deleteMessage = async (channel: SlackChannel, ts: string): Promise<SlackResult> => {
            try {
                const response = await axios.post('https://slack.com/api/chat.delete', {
                    channel,
                    ts,
                }, NotifySlack.formatHeaders());

                if (!response.data.ok)
                    return { success: false, message: 'failed to delete slack message', data: { error: response.data.error } };

                return { success: true, message: 'deleted slack message' };
            } catch (error) {
                return { success: false, message: 'failed to delete slack message', data: { error: UTIL.getErrorString(error) } };
            }
        };

        channel = channel ?? NotifySlack.defaultChannel;
        const msgResult: SlackResult = await getMessagesByChannel(channel);
        if(msgResult.success===false)
            return msgResult;
        else if(msgResult.data.messages.length<=0)
            return { success: true, message: 'no slack messages for channel', data: { channel } };

        for (const message of msgResult.data.messages) {
            if (message.ts)
                await deleteMessage(channel, message.ts);
        }

        return { success: true, message: 'deleted slack messages from channel', data: { channel, count: msgResult.data.messages.length } };
    }
    //#endregion

    //#region FORMATTING
    private static formatBlocks(params: NotifyPackage): any {
        const msgPrefix: string = getMessagePrefixByType(params.type);
        const duration: string | undefined = (params.endDate) ? UTIL.getDurationString(params.startDate,params.endDate) : undefined;

        // build our blocks based on the package received
        const blocks: Array<any> = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `[${msgPrefix}] ${UTIL.truncateString(params.message,60)} ${(params.detailsLink) ? `(<${params.detailsLink.url}|${params.detailsLink.label}>)` : '' }`
                }
            },
            {
                type: 'section',
                expand: false,
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Started:* ${UTIL.getFormattedDate(params.startDate)}${ (duration) ? '\n*Duration:* '+duration : ''}${ (params.sendTo && params.sendTo.length>0) ? '\n*Who:* '+ ((params.sendTo.length>0) ? `<@${params.sendTo[0]}>` : 'NA') : '' }`
                    },
                    {
                        type: 'mrkdwn',
                        text: `${ (params.detailsMessage) ? '\n*Details:* '+params.detailsMessage : '' }`
                    }
                ]
            },
        ];

        // if we have a link add it to the end as a link
        if(params.detailsLink) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${params.detailsLink.url}|${params.detailsLink.label}>`
                }
            });
        }

        return blocks;
    }
    //#endregion

    //#region SENDING
    private static async postMessage(entry: SlackEntry): Promise<SlackResult> {
        try {
            // build our body for the message to be send
            const slackBody = {
                icon_url: entry.iconUrl,
                username: 'Packrat'+UTIL.getRandomWhitespace()+'.', // need random whitespace so icon always shows
                channel: entry.channel,
                text: entry.subject,
                blocks: entry.blocks,
            };

            const response: AxiosResponse = await axios.post('https://slack.com/api/chat.postMessage', slackBody, NotifySlack.formatHeaders());
            if(response.data.ok===false)
                return { success: false, message: 'failed to send slack message', data: { error: response.data?.error } };
            else
                return { success: true, message: 'slack message sent' };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                // If error is an AxiosError, handle it accordingly
                return { success: false, message: 'failed to send slack message (axios)', data: { error: error.response?.data } };
            } else if (error instanceof Error) {
                // Handle other types of errors (JavaScript errors)
                return { success: false, message: 'failed to send slack message', data: { error: UTIL.getErrorString(error) } };
            } else {
                return { success: false, message: 'failed to send slack message (unknown)', data: { error: UTIL.getErrorString(error) } };
            }
        }
    }
    private static async sendMessageRaw(type: NotifyType, subject: string, blocks: Array<any>, iconUrl?: string, channel?: SlackChannel): Promise<SlackResult> {

        const entry: SlackEntry = {
            type,
            channel: channel ?? NotifySlack.defaultChannel,
            iconUrl: iconUrl ?? getMessageIconUrlByType(type,'slack'),
            subject,
            blocks,
        };

        // if we have a manager use it, otherwise, just send directly
        if(NotifySlack.rateManager)
            return NotifySlack.rateManager.add(entry);
        else
            return NotifySlack.postMessage(entry);
    }
    public static async sendMessage(params: NotifyPackage, channel?: SlackChannel): Promise<SlackResult> {

        const subject: string = UTIL.truncateString(`[${getMessagePrefixByType(params.type)}] ${params.message}`,60);
        const blocks: Array<any> = NotifySlack.formatBlocks(params);

        // send the message via raw. icon will be determined from the type
        return NotifySlack.sendMessageRaw(params.type,subject,blocks,undefined,channel);
    }
    //#endregion

    //#region TESTING
    //#endregion
}
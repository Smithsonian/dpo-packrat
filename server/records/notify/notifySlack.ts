/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/**
 * TODO
 * - support multiple user mentions
  * - collapsible details for messages (send second reply to first message with details)
 */
import axios, { AxiosResponse } from 'axios';
import * as UTIL from '../utils/utils';
import { ENVIRONMENT_TYPE } from '../../config';
import { NotifyPackage, NotifyType, getTypeString, getMessagePrefixByType, getMessageIconUrlByType } from './notifyShared';
import { RateManager, RateManagerConfig, RateManagerResult } from '../utils/rateManager';
// import { Logger as LOG, LogSection } from '../logger/log';

//#region TYPES & INTERFACES
// declaring this empty for branding/clarity since it is used
// for instances that are not related to the RateManager
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlackResult extends RateManagerResult {}

interface SlackEntry {
    type: NotifyType,
    channel: string,        // ID of the slack channel
    iconUrl: string         // what icon to use for the message
    subject: string,        // the main subject line. often truncated to 60 chars
    blocks: Array<any>,     // blocks array holds the message structure
    details: Array<any>,    // blocks for message details
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
    private static apiKey: string;

    public static isActive(): boolean {
        // we're initialized if we have a logger running
        return (NotifySlack.rateManager!=null);
    }
    public static getRateManager(): RateManager<SlackEntry> | null {
        return NotifySlack.rateManager;
    }
    public static configure(env: ENVIRONMENT_TYPE, apiKey: string, targetRate?: number, burstRate?: number, burstThreshold?: number): SlackResult {

        NotifySlack.defaultChannel = (env && env===ENVIRONMENT_TYPE.PRODUCTION) ? SlackChannel.PACKRAT_OPS: SlackChannel.PACKRAT_DEV;
        NotifySlack.apiKey = apiKey;

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
    public static async clearChannel(channel?: SlackChannel): Promise<SlackResult> {

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
        const getRepliesByMessage = async (channel: SlackChannel, ts: string): Promise<SlackResult> => {
            try {
                const response = await axios.get('https://slack.com/api/conversations.replies', {
                    ...NotifySlack.formatHeaders(),
                    params: {
                        channel,
                        ts,  // Pass the message timestamp to get its replies
                    }
                });

                if (response.data.ok)
                    return { success: true, message: 'got slack replies', data: { replies: response.data.messages } };
                else
                    return { success: false, message: 'failed to fetch slack replies', data: { error: response.data.error, channel } };

            } catch (error) {
                return { success: false, message: 'failed to fetch slack replies', data: { error: UTIL.getErrorString(error), channel } };
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
            if (message.ts) {
                // Check for any replies (thread messages) associated with this message
                const replyResult: SlackResult = await getRepliesByMessage(channel, message.ts);
                if (replyResult.success && replyResult.data.replies.length > 1) {
                    // Delete all the replies before deleting the main message
                    for (const reply of replyResult.data.replies) {
                        if (reply.ts !== message.ts) {  // Avoid deleting the original message here
                            await deleteMessage(channel, reply.ts);
                        }
                    }
                }
                // Now delete the original message
                await deleteMessage(channel, message.ts);
            }
        }

        return { success: true, message: 'deleted slack messages & replies from channel', data: { channel, count: msgResult.data.messages.length } };
    }
    //#endregion

    //#region FORMATTING
    private static formatHeaders(): any {
        // we need to sign all requests to the API by including our key in the headers
        const slackToken = NotifySlack.apiKey;
        return {
            headers: {
                'Authorization': `Bearer ${slackToken}`,
                'Content-Type': 'application/json; charset=utf-8',
            }
        };
    }
    private static formatBlocks(params: NotifyPackage): { main: any, details: any } {
        // return two blocks. The first is for the main message and the other is a reply to its thread.
        // we do this to keep the main thread clean, but still offer details to the user that are helpful

        // const msgPrefix: string = getMessagePrefixByType(params.type);
        const duration: string | undefined = (params.endDate) ? UTIL.getDurationString(params.startDate,params.endDate) : undefined;

        // build our blocks based on the package received
        const mainBlocks: Array<any> = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${UTIL.truncateString(params.message,60)} ${(params.detailsLink) ? `(<${params.detailsLink.url}|${params.detailsLink.label}>)` : '' }`
                }
            }
        ];
        const detailsBlocks: Array<any> = [{
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
        }];

        // figure out what style we want given the message type
        let buttonStyle: string = 'default';
        if(NotifyType[params.type].includes('ERROR') || NotifyType[params.type].includes('FAILED'))
            buttonStyle = 'danger';
        else if(NotifyType[params.type].includes('PASSED'))
            buttonStyle = 'primary';

        // if we have a link add it to the end as a link
        if(params.detailsLink) {
            detailsBlocks.push({
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: params.detailsLink.label,
                            emoji: true
                        },
                        style: buttonStyle,
                        url: params.detailsLink.url,
                        action_id: 'button_click'
                    }
                ]
            });
        }

        return { main: mainBlocks, details: detailsBlocks };
    }
    //#endregion

    //#region SENDING
    private static async postMessage(entry: SlackEntry): Promise<SlackResult> {
        try {
            // get our headers
            const slackHeaders: any = NotifySlack.formatHeaders();

            // build our body for the message to be sent
            const slackBody: any = {
                icon_url: entry.iconUrl,
                username: `${getTypeString(entry.type).replace(' ',': ')}${UTIL.getRandomWhitespace()+'.'}`, //`Packrat: ${getMessageCategoryByType(entry.type)}`+UTIL.getRandomWhitespace()+'.', // need random whitespace so icon always shows
                channel: entry.channel,
                text: entry.subject,
                blocks: entry.blocks,
            };

            // send the main message and wait for it to return
            const mainResponse: AxiosResponse = await axios.post('https://slack.com/api/chat.postMessage', slackBody, slackHeaders);
            if(mainResponse.data.ok===false)
                return { success: false, message: 'failed to send slack message', data: { error: mainResponse.data?.error } };

            // grab our timestamp to use it for a reply response w/ details and update body
            slackBody.thread_ts = mainResponse.data.ts;
            slackBody.text = 'Context';
            slackBody.blocks = entry.details;
            slackBody.username = 'Context';

            // send our reply and wait
            const detailsResponse: AxiosResponse = await axios.post('https://slack.com/api/chat.postMessage', slackBody, slackHeaders);
            if(detailsResponse.data.ok===false)
                return { success: false, message: 'failed to send slack message details', data: { error: mainResponse.data?.error } };

            // success
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
    private static async sendMessageRaw(type: NotifyType, subject: string, blocks: Array<any>, details: Array<any>, iconUrl?: string, channel?: SlackChannel): Promise<SlackResult> {

        const entry: SlackEntry = {
            type,
            channel: channel ?? NotifySlack.defaultChannel,
            iconUrl: iconUrl ?? getMessageIconUrlByType(type,'slack'),
            subject,
            blocks,
            details,
        };

        // if we have a manager use it, otherwise, just send directly
        if(NotifySlack.rateManager)
            return NotifySlack.rateManager.add(entry);
        else
            return NotifySlack.postMessage(entry);
    }
    public static async sendMessage(params: NotifyPackage, channel?: SlackChannel): Promise<SlackResult> {

        const subject: string = UTIL.truncateString(`[${getMessagePrefixByType(params.type)}] ${params.message}`,60);
        const { main, details } = NotifySlack.formatBlocks(params);

        // send the message via raw. icon will be determined from the type
        return NotifySlack.sendMessageRaw(params.type,subject,main,details,undefined,channel);
    }
    //#endregion
}
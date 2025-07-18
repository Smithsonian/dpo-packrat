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
import { RateManager, RateManagerConfig, RateManagerResult, RateManagerMetrics } from '../utils/rateManager';
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

export class SlackChannel {
    static PACKRAT_OPS:    string = ''; // packrat-ops: for user focused messages and system updates
    static PACKRAT_DEV:    string = ''; // packrat-dev: for testing and development messages
    static PACKRAT_SYSTEM: string = ''; // packrat-system: for admin only notices

    static getString(channel: string): string {
        if(SlackChannel.PACKRAT_OPS===channel)
            return 'PACKRAT_OPS';
        if(SlackChannel.PACKRAT_DEV===channel)
            return 'PACKRAT_DEV';
        if(SlackChannel.PACKRAT_SYSTEM===channel)
            return 'PACKRAT_SYSTEM';

        return `unknown: ${channel}`;
    }
}
//#endregion

export class NotifySlack {
    private static rateManager: RateManager<SlackEntry> | null =  null;
    private static apiKey: string;
    private static defaultChannel: SlackChannel = SlackChannel.PACKRAT_DEV;

    public static isActive(): boolean {
        // we're initialized if we have a logger running
        return (NotifySlack.rateManager!=null);
    }
    public static getRateManager(): RateManager<SlackEntry> | null {
        return NotifySlack.rateManager;
    }
    public static configure(env: ENVIRONMENT_TYPE, apiKey: string, channels: string[], targetRate?: number, burstRate?: number, burstThreshold?: number): SlackResult {
        // assign our channels
        if(channels.length !=3)
            return { success: false, message: 'Slack notifier configuration failed', data: { error: 'invalid channels. set your environment with 3 channel IDs separated buy comma for: dev, ops, and admin.', channels }};
        SlackChannel.PACKRAT_OPS = channels[0];
        SlackChannel.PACKRAT_DEV = channels[1];        
        SlackChannel.PACKRAT_SYSTEM = channels[2];
        NotifySlack.defaultChannel = (env && env===ENVIRONMENT_TYPE.PRODUCTION) ? SlackChannel.PACKRAT_OPS: SlackChannel.PACKRAT_DEV;

        // assign our key
        NotifySlack.apiKey = apiKey;

        // if we want a rate limiter then we build it
        const rmConfig: RateManagerConfig<SlackEntry> = {
            targetRate: targetRate ?? 1,    // Slack API limits messages to 1/sec
            burstRate: burstRate ?? 1,
            burstThreshold: burstThreshold ?? Number.MAX_SAFE_INTEGER, // never enter burst mode
            onPost: NotifySlack.postMessage,
        };

        // if we already have a manager we re-configure it (causes restart). otherwise, we create a new one
        if(NotifySlack.rateManager)
            NotifySlack.rateManager.setConfig(rmConfig);
        else
            NotifySlack.rateManager = new RateManager<SlackEntry>(rmConfig);

        return { success: true, message: 'configured Slack notifier.', data:  (({ onPost: _onPost, ...rest }) => rest)(rmConfig) };
    }

    //#region UTILS
    public static async clearChannel(channel?: SlackChannel, forceAll: boolean = false): Promise<SlackResult> {

        const getMessagesByChannel = async (channel: SlackChannel, cursor?: string): Promise<SlackResult> => {
            try {
                const response = await axios.get('https://slack.com/api/conversations.history', {
                    ...NotifySlack.formatHeaders(),
                    params: {
                        channel,
                        limit: 100,  // Max messages per Slack request
                        cursor,      // For pagination
                    }
                });

                if (response.data.ok) {
                    return {
                        success: true,
                        message: 'got slack messages',
                        data: {
                            channel,
                            messages: response.data.messages,
                            nextCursor: response.data.response_metadata?.next_cursor,
                        }
                    };
                } else {
                    return {
                        success: false,
                        message: 'failed to fetch slack messages',
                        data: { error: response.data.error, channel }
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    message: 'failed to fetch slack messages',
                    data: { error: UTIL.getErrorString(error), channel }
                };
            }
        };
        const getRepliesByMessage = async (channel: SlackChannel, ts: string, cursor?: string): Promise<SlackResult> => {
            try {
                const response = await axios.get('https://slack.com/api/conversations.replies', {
                    ...NotifySlack.formatHeaders(),
                    params: {
                        channel,
                        ts,          // Message timestamp for fetching replies
                        limit: 100,
                        cursor,      // For pagination
                    }
                });

                if (response.data.ok) {
                    return {
                        success: true,
                        message: 'got slack replies',
                        data: { replies: response.data.messages }
                    };
                } else {
                    return {
                        success: false,
                        message: 'failed to fetch slack replies',
                        data: { error: response.data.error, channel }
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    message: 'failed to fetch slack replies',
                    data: { error: UTIL.getErrorString(error), channel }
                };
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
        let totalDeleted = 0;
        let cursor: string | undefined = undefined;
        let hasMore = true;

        // compute cut-off (3 days in seconds)
        const cutoffTimestamp = Date.now() / 1000 - 3 * 24 * 60 * 60;

        while (hasMore) {
            // 1) fetch one page of history
            const history = await getMessagesByChannel(channel, cursor);
            if (!history.success) return history;

            const { messages, nextCursor } = history.data;

            // 2) for each message, delete full thread then parent
            for (const msg of messages) {

                // see if the message is old enough
                const msgTs = parseFloat(msg.ts);
                if (forceAll || msgTs < cutoffTimestamp) {

                    // delete replies (paged with while)
                    let threadCursor: string | undefined = undefined;
                    let threadHasMore = true;

                    while (threadHasMore) {
                        const repliesRes = await getRepliesByMessage(channel, msg.ts, threadCursor);
                        if (!repliesRes.success) break;
                        const { replies, nextCursor: nextReplyCursor } = repliesRes.data;

                        for (const reply of replies) {
                            const replyTs = parseFloat(reply.ts);
                            if (forceAll || (reply.ts !== msg.ts &&  replyTs < cutoffTimestamp)) {
                                const del = await deleteMessage(channel, reply.ts);
                                if (del.success) totalDeleted++;
                                await UTIL.delay(1300);          // ~50 deletions/min
                            }
                        }

                        threadCursor = nextReplyCursor;
                        threadHasMore = Boolean(threadCursor);
                        if (threadHasMore) await UTIL.delay(61000);  // ~1 history/min
                    }

                    // now delete the parent
                    const delParent = await deleteMessage(channel, msg.ts);
                    if (delParent.success) totalDeleted++;
                    await UTIL.delay(1300);
                }
            }

            // prepare next page of top-level history
            cursor = nextCursor;
            hasMore = Boolean(cursor);
            if (hasMore) await UTIL.delay(61000);  // ~1 history/min
        }

        return { success: true, message: 'deleted slack messages & replies from channel', data: { channel, count: totalDeleted } };
    }
    public static async waitForQueueToDrain(timeout: number = 10000): Promise<SlackResult> {

        if(!this.rateManager)
            return { success: false, message: 'no manager running' };

        const result = await this.rateManager.waitUntilIdle(timeout);
        if(!result.success)
            return { success: false, message: result.message, data: { queueSize: result.queueSize } };

        return { success: true, message: result.message };
    }
    public static getStatus(): SlackResult {

        if(NotifySlack.isActive()===false)
            return { success: false, message: 'Slack not running' };

        // grab manager metrics to get queue size (backpressure)
        const rateManagerMetrics: RateManagerMetrics | undefined = NotifySlack.rateManager?.getMetrics();

        const result: SlackResult = {
            success: true,
            message: 'Slack status',
            data: {
                isActive: NotifySlack.isActive(),
                queueSize: rateManagerMetrics?.queueLength ?? -1,
            }
        };

        return result;
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

        // figure out who we're attaching this to
        let who: string = '';
        if(params.sendTo && params.sendTo.length>0) {
            who = '\n*Who:* ';
            who += (params.sendTo.includes('everyone')) ? '<!channel>' : `<@${params.sendTo[0]}>`;
        }

        // build our blocks based on the package received
        const mainBlocks: Array<any> = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${params.message} ${(params.detailsLink) ? `(<${params.detailsLink.url}|${params.detailsLink.label}>)` : '' }`
                }
            }
        ];
        const detailsBlocks: Array<any> = [{
            type: 'section',
            expand: false,
            fields: [
                {
                    type: 'mrkdwn',
                    text: `*Started:* ${UTIL.getFormattedDate(params.startDate)}${ (duration) ? '\n*Duration:* '+duration : ''}${who}`
                },
                {
                    type: 'mrkdwn',
                    text: `${ (params.detailsMessage) ? '\n*Details:* '+params.detailsMessage : '' }`
                }
            ]
        }];

        // figure out what style we want given the message type
        let buttonStyle: string | undefined = undefined; //'default';
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
            // Note: we override the username in favor of a meaningful title/message
            const slackBody: any = {
                icon_url: entry.iconUrl,
                username: `${getTypeString(entry.type).replace(' ',': ')}${UTIL.getRandomWhitespace()+'.'}`, //`Packrat: ${getMessageCategoryByType(entry.type)}`+UTIL.getRandomWhitespace()+'.', // need random whitespace so icon always shows
                channel: entry.channel,
                text: entry.subject,
                blocks: entry.blocks,
            };
            
            // send the main message and wait for it to return
            const mainResponse: AxiosResponse = await axios.post('https://slack.com/api/chat.postMessage', slackBody, slackHeaders);
            if(mainResponse.data.ok===false) {
                return { success: false, message: 'failed to send slack message', data: { error: mainResponse.data?.error } };
            }

            // grab our timestamp to use it for a reply response w/ details and update body
            slackBody.thread_ts = mainResponse.data.ts;
            slackBody.text = slackBody.text;        // Reply notification message
            slackBody.blocks = entry.details;
            slackBody.username = slackBody.text;    // Reply title/header

            // send our reply and wait
            // Note: 'replies' are used here to keep details out of the main thread, which can make it difficult to navigate.
            //       Slack API does not support collapsible content unless stored remotely (e.g. a web page or separate request).
            const detailsResponse: AxiosResponse = await axios.post('https://slack.com/api/chat.postMessage', slackBody, slackHeaders);
            if(detailsResponse.data.ok===false)
                return { success: false, message: 'failed to send slack message details', data: { error: `Slack - ${detailsResponse.data?.error}` } };

            // success
            return { success: true, message: 'slack message sent' };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // If error is an AxiosError, handle it accordingly
                return { success: false, message: 'failed to send slack message (axios)', data: { error: error.response?.data.error, rate: NotifySlack.rateManager?.getMetrics().rates.current } };
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
            channel: (channel ?? NotifySlack.defaultChannel) as string,
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
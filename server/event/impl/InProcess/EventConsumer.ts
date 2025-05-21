/* eslint-disable @typescript-eslint/no-explicit-any */

import * as EVENT from '../../interface';
import { EventEngine } from './EventEngine';
import { RecordKeeper as RK } from '../../../records/recordKeeper';
import * as H from '../../../utils/helpers';

import { Mutex, MutexInterface, withTimeout, E_TIMEOUT, E_CANCELED } from 'async-mutex';

export abstract class EventConsumer implements EVENT.IEventConsumer {
    private engine: EventEngine;
    private completionMutexes: MutexInterface[] = [];
    private eventData: any[] = [];

    constructor(engine: EventEngine) {
        this.engine = engine;
    }

    // #region InProcess EventConsumer interface
    protected abstract eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void>;
    // #endregion

    /** Called for consumer to poll event system for events */
    async poll<Key, Value>(eTopic: EVENT.eEventTopic, timeout: number): Promise<EVENT.IEventData<Key, Value>[] | null> {
        await this.engine.registerConsumer(eTopic, this);

        const waitMutex: MutexInterface = withTimeout(new Mutex(), timeout);
        this.completionMutexes.push(waitMutex);

        const releaseOuter = await waitMutex.acquire();     // first acquire should succeed
        try {
            const releaseInner = await waitMutex.acquire(); // second acquire should wait
            releaseInner();
        } catch (error) {
            if (error === E_CANCELED) {                  // we're done
                const eventData = this.eventData;
                this.eventData = [];
                RK.logWarning(RK.LogSection.eEVENT,'poll','cancelled',{ eTopic, eventData },'Event.Consumer');
                return eventData;
            } else if (error === E_TIMEOUT) {               // we timed out
                RK.logError(RK.LogSection.eEVENT,'poll failed','timedout',{ eTopic, timeout },'Event.Consumer');
                return [];
            } else {
                RK.logError(RK.LogSection.eEVENT,'poll failed',`cannot acquire mutex: ${H.Helpers.getErrorString(error)}`,{ eTopic, timeout },'Event.Consumer');
                return [];
            }
        } finally {
            releaseOuter();
            await this.engine.unregisterConsumer(eTopic, this);
        }
        return [];
    }

    /** Called to let consumer know about events, when consumer has already been registered via IEventEngine.createConsumer(eTopic: eEventTopic) */
    async event<Key, Value>(_eTopic: EVENT.eEventTopic, data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        this.eventData.concat(data);
        for (const mutex of this.completionMutexes)
            mutex.cancel();
        this.eventWorker(data);
    }
}
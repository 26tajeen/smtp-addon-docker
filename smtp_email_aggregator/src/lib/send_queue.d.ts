import { Stream } from 'stream';
import { Jobs } from './jobs';
import { RawMessage } from './rawmessage';

declare class SendQueue {
    private currentQueue: Jobs;
    private isPolling: boolean;
    private pollingQueue: Array<{ resolve: (value: any) => void, index: number }>;
    private failedCount: number;
    private isPaused: boolean;
    private pauseQueue: Array<{ resolve: (value: any) => void, index: number }>;
    private pausedTimeout?: NodeJS.Timeout;

    constructor();

    add(header: any, body: Stream | string): Promise<void>;
    getJob(index: number): Promise<RawMessage | undefined>;
    private clearPauseState(index: number): void;
    private clearPollingState(index: number): void;
    private reportSuccess(index: number, to: string): void;
    private reportError(index: number, rawmessage: RawMessage, message: string, id: string): void;
    private thread(index: number): Promise<void>;
    start(): Promise<void>;
}

export const sendQueue: SendQueue;
import { Readable } from 'stream';

export function streamToString(stream: Readable): Promise<string>;
export function safeReadFile(filePath: string, encoding?: BufferEncoding): Promise<string | Buffer | null>;
export function generateRandomKey(): string;
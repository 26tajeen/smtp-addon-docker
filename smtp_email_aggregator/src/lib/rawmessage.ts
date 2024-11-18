import { join } from 'path';
import { queuePath } from './paths';
import { readFile, rm, moveSync, ensureDir } from 'fs-extra';
import { logger } from './logger';
import config from './config';

export class RawMessage {
    id: string;
    isBlocked: boolean;
    failedAttempts: number;

    constructor(id: string) {
        this.id = id;
        this.isBlocked = false;
        this.failedAttempts = 0;
    }

    get headerFilePath(): string {
        const dirPath = this.getDirPath();
        return join(dirPath, "header");
    }

    get bodyFilePath(): string {
        const dirPath = this.getDirPath();
        return join(dirPath, "body");
    }



    getDirPath(): string {
        return this.isBlocked ? this.getBlockedDirPath() : this.getReadyDirPath();
    }

    getReadyDirPath(): string {
        return join(queuePath, this.id);
    }

    getBlockedDirPath(): string {
        return join(queuePath, `__${this.id}__`);
    }

    async ensureDirExists(): Promise<void> {
        const dirPath = this.getDirPath();
        await ensureDir(dirPath);
        logger.debug(`RawMessage: Ensured directory exists for id ${this.id}`);
    }

    block(): void {
        if (this.isBlocked) {
            throw new Error("rawmessage is already blocked, cannot block");
        }
        moveSync(this.getReadyDirPath(), this.getBlockedDirPath());
        this.isBlocked = true;
        logger.debug(`RawMessage: Blocked message with id ${this.id}`);
    }

async getHeader(): Promise<any | null> {
    try {
        await this.ensureDirExists();
        const headerContent = await readFile(this.headerFilePath, "utf8");
        logger.debug(`RawMessage: Read header content for id ${this.id}: ${headerContent}`);
        const parsedHeader = JSON.parse(headerContent);
        if (!parsedHeader.to) {
            logger.debug(`RawMessage: Missing 'to' field in header for id ${this.id}`);
        }
        // Ensure all necessary fields are present
        parsedHeader.from = parsedHeader.from || 'unknown@example.com';
        parsedHeader.to = parsedHeader.to || 'undisclosed-recipients:;';
        parsedHeader.subject = parsedHeader.subject || 'No Subject';
        return parsedHeader;
    } catch (err: any) {
        logger.error(`RawMessage: Error reading or parsing header for id ${this.id}: ${err.message}`);
        return null;
    }
}

async getBody(): Promise<string> {
    try {
        const bodyContent = await readFile(this.bodyFilePath, 'utf8');
        logger.info(`RawMessage: Read body content for id ${this.id}, length: ${bodyContent.length} bytes`);
        logger.info(`RawMessage: First 200 characters of body content: ${bodyContent.substring(0, 200)}`);
        return bodyContent;
    } catch (err: any) {
        logger.error(`RawMessage: Error reading body for id ${this.id}: ${err.message}`);
        throw err;
    }
}

    getBodyText(): string {
        return config.aggregate.bodyText;
    }

    async remove(): Promise<void> {
        try {
            const dirPath = this.getDirPath();
            await rm(dirPath, { recursive: true });
            logger.debug(`RawMessage: Removed message with id ${this.id}`);
        } catch (err: any) {
            logger.error(`RawMessage: Error removing message with id ${this.id}: ${err.message}`);
        }
    }
}
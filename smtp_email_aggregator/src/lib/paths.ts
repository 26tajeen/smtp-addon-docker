import * as path from 'path';
import * as fs from 'fs-extra';
import { logger } from './logger';

export const packagePath = path.resolve(__dirname, "..", "..");
export const configPath = path.resolve(packagePath, "config.yaml");
export const rawmessagePath = path.resolve(packagePath, "rawmessage");
export const dataPath = path.resolve(packagePath, "data");
export const queuePath = path.resolve(dataPath, "queue");
export const waitingPath = path.resolve(dataPath, "waiting");

export function ensureDirectoriesExist(): void {
    try {
        fs.ensureDirSync(dataPath);
        fs.ensureDirSync(queuePath);
        fs.ensureDirSync(waitingPath);
        logger.info('All required directories have been created or verified');
    } catch (err: unknown) {
        if (err instanceof Error) {
            logger.error(`Error creating directories: ${err.message}`);
        } else {
            logger.error('An unknown error occurred while creating directories');
        }
        process.exit(1);
    }
}
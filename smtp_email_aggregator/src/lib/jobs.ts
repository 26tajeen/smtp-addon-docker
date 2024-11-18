import { RawMessage } from './rawmessage';
import { queuePath } from './paths';
import { readdir, stat, ensureDir, move } from 'fs-extra';
import { join } from 'path';
import { logger } from './logger';

export class Jobs {
    items: RawMessage[];

    constructor() {
        this.items = [];
    }

    static async load(): Promise<Jobs> {
        const ret = new Jobs();
        try {
            await ensureDir(queuePath);
            logger.debug(`Ensured queue directory exists: ${queuePath}`);
            
            const entities = await readdir(queuePath);
            logger.debug(`Read ${entities.length} entities from queue directory`);
            
            for (const entity of entities) {
                const fullPath = join(queuePath, entity);
                try {
                    const stats = await stat(fullPath);
                    if (stats.isDirectory() && /^[0-9a-f]{40}$/.test(entity)) {
                        ret.items.push(new RawMessage(entity));
                        logger.debug(`Added RawMessage for entity: ${entity}`);
                    } else {
                        logger.debug(`Skipped entity ${entity}: not a valid queue item`);
                    }
                } catch (err) {
                    logger.error(`Error processing queue item ${entity}: ${err}`);
                }
            }
        } catch (err) {
            logger.error(`Error loading queue: ${err}`);
        }
        logger.info(`Loaded ${ret.items.length} items from queue`);
        return ret;
    }

    static async unblockAll(): Promise<void> {
        try {
            await ensureDir(queuePath);
            const entities = await readdir(queuePath);
            for (const entity of entities) {
                try {
                    const fullPath = join(queuePath, entity);
                    const stats = await stat(fullPath);
                    if (stats.isDirectory() && /^__[0-9a-f]{40}__$/.test(entity)) {
                        const id = entity.substr(2, entity.length - 4);
                        const fromDir = fullPath;
                        const toDir = join(queuePath, id);
                        await move(fromDir, toDir);
                        logger.debug(`Unblocked queue item: ${id}`);
                    }
                } catch (err) {
                    logger.error(`Error unblocking queue item ${entity}: ${err}`);
                }
            }
        } catch (err) {
            logger.error(`Error unblocking queue: ${err}`);
        }
    }
}
import { logger } from './logger';
import { config } from './config';
import * as MQTT from 'mqtt';

interface EmailStats {
    period: {
        start: Date;
        end: Date;
    };
    counts: {
        total: number;
        paired: number;
        standalone: number;
    };
}

interface MQTTStats extends EmailStats {
    queue: {
        length: number;
        processing: number;
        failed: number;
    };
    performance: {
        averageProcessingTime: number;
        successRate: number;
    };
    smtp: {
        connected: boolean;
        lastError?: string;
    };
}

interface EmailSummaryEntry {
    subject: string;
    count: number;
    timestamp: Date;
    paired: boolean;
    messageType?: 'invoice' | 'statement' | 'general';
}

interface EmailSummaryStats extends MQTTStats {
    summary: {
        period: {
            start: Date;
            end: Date;
        };
        emails: {
            subjects: string[];
            totalCount: number;
            summarized: boolean;
            topPatterns?: {
                pattern: string;
                count: number;
            }[];
        };
    };
}

class MqttService {
    private client: MQTT.Client | null = null;
    private statsBuffer: EmailStats;
    private statsTimeout: NodeJS.Timeout | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private readonly RECONNECT_DELAY = 5000;
    private isConnected = false;
    private emailSubjects: EmailSummaryEntry[] = [];
    private summaryTimeout: NodeJS.Timeout | null = null;
    private readonly SUMMARY_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private messageProcessingTimes: number[] = [];
    private readonly MAX_PROCESSING_TIMES = 100;
    private successCount = 0;
    private totalCount = 0;
    private currentQueue: { items: any[] } = { items: [] };
    private pollingQueue: any[] = [];
    private failedCount = 0;
    private lastSmtpError?: string;

    constructor() {
        this.statsBuffer = this.createNewStatsBuffer();
        this.setupMqttConnection();
        logger.debug(`Summary timer set to ${this.SUMMARY_INTERVAL/1000} seconds`);
    }

    public recordEmailSubject(subject: string, paired: boolean): void {
        this.emailSubjects.push({
            subject,
            count: 1,
            timestamp: new Date(),
            paired
        });
        logger.debug(`Added email subject to summary buffer. Current count: ${this.emailSubjects.length}`);

        if (!this.summaryTimeout) {
            logger.debug(`Starting summary timer for ${this.SUMMARY_INTERVAL/1000} seconds`);
            this.summaryTimeout = setTimeout(() => {
                logger.debug('Summary timer triggered, publishing summary...');
                this.publishSummary();
            }, this.SUMMARY_INTERVAL);
        }
    }

    private summarizeSubjects(subjects: EmailSummaryEntry[]): {
        subjects: string[];
        topPatterns: { pattern: string; count: number; }[];
    } {
        const typeGroups = new Map<string, EmailSummaryEntry[]>();
        subjects.forEach(entry => {
            const type = entry.paired ? 
                'Consolidated Invoice and Statement for Customer' :
                // Remove the double escaping - just use 'General Email #'
                entry.subject.replace(/[0-9]+/g, '#');
                
            const group = typeGroups.get(type) || [];
            group.push(entry);
            typeGroups.set(type, group);
        });

        const patterns = Array.from(typeGroups.entries())
            .map(([pattern, entries]) => ({
                pattern,  // Don't escape the # again
                count: entries.length
            }))
            .sort((a, b) => b.count - a.count);

        const exampleSubjects = subjects
            .filter(s => s.paired)
            .concat(subjects.filter(s => !s.paired))
            .slice(0, 5)
            .map(s => s.subject);

        return {
            subjects: exampleSubjects,
            topPatterns: patterns
        };
    }

    private publishSummary(): void {
        logger.debug(`Publishing summary. Connected: ${this.isConnected}, Subjects: ${this.emailSubjects.length}`);
        
        const summaryStats: EmailSummaryStats = {
            ...this.getFullStats(),
            summary: {
                period: {
                    start: this.emailSubjects.length > 0 ? this.emailSubjects[0].timestamp : new Date(),
                    end: new Date()
                },
                emails: {
                    subjects: [],
                    totalCount: this.emailSubjects.length,
                    summarized: false
                }
            }
        };

        if (this.isConnected && this.emailSubjects.length > 0) {
            const summary = this.summarizeSubjects(this.emailSubjects);
            logger.debug(`Summarized ${summary.subjects.length} subjects with ${summary.topPatterns.length} patterns`);
            
            summaryStats.summary.emails = {
                subjects: summary.subjects,
                totalCount: this.emailSubjects.length,
                summarized: this.emailSubjects.length > 5,
                ...(summary.topPatterns.length > 0 && { topPatterns: summary.topPatterns })
            };
        }

        logger.debug('Publishing to smtp_aggregator/summary...');
        this.publish(
            'smtp_aggregator/summary',
            summaryStats,
            { retain: true }
        );
        logger.debug('Summary published');

        this.emailSubjects = [];
        this.summaryTimeout = null;
    }

    public recordMessageProcessingTime(processingTime: number): void {
        this.messageProcessingTimes.push(processingTime);
        if (this.messageProcessingTimes.length > this.MAX_PROCESSING_TIMES) {
            this.messageProcessingTimes.shift();
        }
        logger.debug(`Recorded processing time: ${processingTime}ms`);
    }

    public recordEmailSent(paired: boolean): void {
        const startTime = Date.now();
        
        // Update stats based on whether it's paired or standalone
        this.incrementStats(paired ? 'messages_paired' : 'messages_unpaired');
        
        const processingTime = Date.now() - startTime;
        this.recordMessageProcessingTime(processingTime);
        
        // Add detailed logging
        logger.debug(`Recorded email sent - paired: ${paired}, current stats:`, {
            total: this.statsBuffer.counts.total,
            paired: this.statsBuffer.counts.paired,
            standalone: this.statsBuffer.counts.standalone
        });
    }


    public reportError(error: Error | string): void {
        try {
            const errorMessage = {
                timestamp: new Date().toISOString(),
                error: typeof error === 'string' ? error : error.message,
                stack: error instanceof Error ? error.stack : undefined
            };

            const topic = config.options.mqtt_error_topic || 'smtp_aggregator/errors';
            this.publish(topic, errorMessage);
            
            if (error.toString().toLowerCase().includes('smtp')) {
                this.setSmtpError(typeof error === 'string' ? error : error.message);
            }
        } catch (err) {
            logger.error('Failed to publish error to MQTT:', err);
        }
    }

    private getQueueStats() {
        return {
            length: this.currentQueue?.items?.length || 0,
            processing: this.pollingQueue.length,
            failed: this.failedCount
        };
    }

    private getPerformanceStats() {
        const avgTime = this.messageProcessingTimes.length > 0
            ? this.messageProcessingTimes.reduce((a, b) => a + b, 0) / this.messageProcessingTimes.length
            : 0;

        // Calculate success rate based on paired vs total processed emails intended for pairing
        const pairableEmails = this.statsBuffer.counts.paired * 2; // Each pair counts as 2 emails
        const successRate = pairableEmails > 0 
            ? (this.statsBuffer.counts.paired * 2 / pairableEmails) * 100 
            : 0;

        return {
            averageProcessingTime: Math.round(avgTime),
            successRate: Math.round(successRate * 100) / 100
        };
    }

    private getSmtpStats() {
        return {
            connected: this.client?.connected || false,
            lastError: this.lastSmtpError
        };
    }

    public setSmtpError(error: string): void {
        this.lastSmtpError = error;
    }

    private getFullStats(): MQTTStats {
        return {
            period: {
                start: this.statsBuffer.period.start,
                end: new Date()
            },
            counts: this.statsBuffer.counts,
            queue: this.getQueueStats(),
            performance: this.getPerformanceStats(),
            smtp: this.getSmtpStats()
        };
    }

    private sendStats(): void {
        if (!this.isConnected) {
            logger.debug('Skipping stats send - not connected');
            return;
        }

        try {
            this.statsBuffer.period.end = new Date();
            const fullStats = this.getFullStats();
            
            // Log the actual counts before sending
            logger.debug('Publishing stats:', {
                total: this.statsBuffer.counts.total,
                paired: this.statsBuffer.counts.paired,
                standalone: this.statsBuffer.counts.standalone,
                success_rate: fullStats.performance.successRate
            });
            
            this.publish(
                config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
                fullStats,
                { retain: true }
            );

            // Important: Create a completely new stats buffer after sending
            this.statsBuffer = this.createNewStatsBuffer();
            this.statsTimeout = null;
            
            // Reset these counters too
            this.successCount = 0;
            this.totalCount = 0;
            this.messageProcessingTimes = [];
            this.failedCount = 0;
        } catch (err) {
            logger.error('Failed to publish stats to MQTT:', err);
        }
    }

    public incrementStats(type: 'messages_received' | 'messages_queued' | 'messages_sent' | 'messages_failed' | 'messages_paired' | 'messages_unpaired'): void {
        logger.debug(`Incrementing stats for type: ${type}`);
        
        // Always increment total for actual messages
        if (type === 'messages_paired' || type === 'messages_unpaired') {
            this.statsBuffer.counts.total++;
        }

        // Track specific types
        if (type === 'messages_paired') {
            // For paired messages, we count one success for each pair
            // (two individual emails become one paired email)
            this.statsBuffer.counts.paired++;
            this.successCount++; 
            logger.debug(`Paired message counted: ${this.statsBuffer.counts.paired}`);
        } else if (type === 'messages_unpaired') {
            // For unpaired/standalone messages, just count them directly
            this.statsBuffer.counts.standalone++;
            logger.debug(`Standalone message counted: ${this.statsBuffer.counts.standalone}`);
        }

        // Calculate success rate based on paired messages
        const pairableEmails = this.statsBuffer.counts.paired * 2; // Each pair represents 2 original emails
        const successRate = pairableEmails > 0 
            ? 100 // If we have pairs, they were all successfully paired
            : 0;

        logger.debug('Current stats buffer:', {
            total: this.statsBuffer.counts.total,
            paired: this.statsBuffer.counts.paired,
            standalone: this.statsBuffer.counts.standalone,
            success_rate: successRate
        });
    } 

    public shutdown(): void {
        if (this.summaryTimeout) {
            clearTimeout(this.summaryTimeout);
            this.publishSummary();
        }    
        if (this.statsTimeout) {
            clearTimeout(this.statsTimeout);
            this.sendStats();
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.client) {
            this.publishStatus('offline');
            this.client.end(true, {}, () => {
                logger.info('MQTT client disconnected');
            });
        }
    }

    private setupMqttConnection() {
        logger.debug('Starting MQTT setup with environment:', {
            NODE_ENV: process.env.NODE_ENV,
            SUPERVISOR_TOKEN: process.env.SUPERVISOR_TOKEN ? 'present' : 'not set',
            HASSIO_TOKEN: process.env.HASSIO_TOKEN ? 'present' : 'not set',
            MQTT_HOST: process.env.MQTT_HOST || 'not set',
            MQTT_PORT: process.env.MQTT_PORT || 'not set',
            MQTT_USERNAME: process.env.MQTT_USERNAME ? 'configured' : 'not set',
            MQTT_PASSWORD: process.env.MQTT_PASSWORD ? 'configured' : 'not set',
            envKeys: Object.keys(process.env).filter(key => 
                key.includes('MQTT') || 
                key.includes('SUPERVISOR') || 
                key.includes('HASSIO')
            )
        });

        const options: MQTT.IClientOptions = {
            keepalive: 60,
            reconnectPeriod: 5000,
            clean: true,
            will: {
                topic: config.mqtt?.status_topic || 'smtp_aggregator/status',
                payload: 'offline',
                qos: 1,
                retain: true
            },
            username: process.env.MQTT_USERNAME || '',
            password: process.env.MQTT_PASSWORD || '',
            rejectUnauthorized: false,
            protocol: 'mqtt'
        };

        const host = process.env.MQTT_HOST || 'core-mosquitto';
        const port = Number(process.env.MQTT_PORT) || 1883;
        const brokerUrl = 'mqtt://localhost:1883';

        logger.debug('Setting up MQTT connection:', {
            brokerUrl,
            username: options.username ? 'configured' : 'not set',
            hasPassword: !!options.password,
            host,
            port
        });

        try {
            this.client = MQTT.connect(brokerUrl, options);

            this.client.on('error', (error: Error & { code?: string }) => {
                const errorDetails = {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                    brokerUrl,
                    host: process.env.MQTT_HOST,
                    port: process.env.MQTT_PORT,
                    hasUsername: !!process.env.MQTT_USERNAME,
                    hasPassword: !!process.env.MQTT_PASSWORD,
                    connectionState: this.client?.connected ? 'connected' : 'disconnected',
                    environmentKeys: Object.keys(process.env),
                    error: JSON.stringify(error, Object.getOwnPropertyNames(error))
                };
                
                logger.error('Detailed MQTT connection error:', errorDetails);
                this.handleDisconnection();
            });

            this.client.on('connect', () => {
                logger.info('Connected to Home Assistant MQTT broker', {
                    broker: brokerUrl,
                    clientId: this.client?.options?.clientId
                });
                this.isConnected = true;
                this.publishStatus('online');
                
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }

                this.subscribe();
            });

            this.client.on('offline', () => {
                logger.warn('MQTT client went offline');
                this.handleDisconnection();
            });

            this.client.on('disconnect', () => {
                logger.warn('MQTT client disconnected');
                this.handleDisconnection();
            });

            this.client.on('message', (topic: string, payload: Buffer) => {
                try {
                    const message = JSON.parse(payload.toString());
                    logger.debug('Received MQTT message:', { topic, message });
                } catch (error) {
                    logger.error('Error processing MQTT message:', error);
                }
            });

        } catch (error) {
            logger.error('Failed to setup MQTT connection:', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    code: (error as any).code
                } : error
            });
            this.handleDisconnection();
        }
    }

    private handleDisconnection() {
        logger.debug('Handling MQTT disconnection', {
            wasConnected: this.isConnected,
            hasReconnectTimeout: !!this.reconnectTimeout
        });
        this.isConnected = false;

        if (!this.reconnectTimeout) {
            this.reconnectTimeout = setTimeout(() => {
                logger.info('Attempting to reconnect to MQTT broker...');
                this.setupMqttConnection();
            }, this.RECONNECT_DELAY);
        }
    }

    private subscribe() {
        if (!this.client?.connected) return;

        const topics = [
            'homeassistant/status',
            'smtp_aggregator/command',
            config.mqtt?.status_topic || 'smtp_aggregator/status',
            'smtp_aggregator/summary'
        ];

        topics.forEach(topic => {
            this.client!.subscribe(topic, (err) => {
                if (err) {
                    logger.error(`Failed to subscribe to ${topic}:`, err);
                } else {
                    logger.debug(`Subscribed to ${topic}`);
                }
            });
        });
    }

    private createNewStatsBuffer(): EmailStats {
        const now = new Date();
        return {
            period: {
                start: now,
                end: now
            },
            counts: {
                total: 0,
                paired: 0,
                standalone: 0
            }
        };
    }

    public publishStatus(status: 'online' | 'offline'): void {
        const topic = config.mqtt?.status_topic || 'smtp_aggregator/status';
        this.publish(topic, status, { retain: true });
    }

    private publish(topic: string, message: any, options: MQTT.IClientPublishOptions = {}): void {
        if (!this.client?.connected) {
            logger.warn('Cannot publish MQTT message - client not connected');
            return;
        }

        try {
            if (topic === 'smtp_aggregator/summary') {
                if (message.summary?.emails?.topPatterns) {
                    message.summary.emails.topPatterns = message.summary.emails.topPatterns.map(
                        (p: {pattern: string, count: number}) => ({
                            pattern: p.pattern.replace(/#/g, '\\#'),
                            count: p.count
                        })
                    );
                }
            }

            const payload = JSON.stringify(message);
            logger.debug(`Publishing to ${topic}:`, {
                payload: typeof message === 'object' ? {
                    type: message.summary ? 'summary' : 'stats',
                    total: message.counts?.total,
                    emailCount: message.summary?.emails?.totalCount
                } : message
            });
            
            this.client.publish(topic, payload, { qos: 1, ...options }, (err) => {
                if (err) {
                    logger.error(`Failed to publish to ${topic}:`, err);
                } else {
                    logger.debug(`Successfully published to ${topic}`);
                }
            });
        } catch (error) {
            logger.error(`Error publishing to ${topic}:`, error);
        }
    }

    public publishDiscovery(): void {
        if (!this.client?.connected) return;

        const deviceInfo = {
            identifiers: ['smtp_email_aggregator'],
            name: 'SMTP Email Aggregator',
            model: 'SMTP Email Aggregator',
            manufacturer: 'Home Assistant Add-on',
            sw_version: process.env.BUILD_VERSION || '1.0.0'
        };

        this.publishSensorDiscovery('status', {
            name: 'SMTP Aggregator Status',
            unique_id: 'smtp_aggregator_status',
            state_topic: config.mqtt?.status_topic || 'smtp_aggregator/status',
            device: deviceInfo,
            icon: 'mdi:email-check'
        });

        this.publishSensorDiscovery('total_emails', {
            name: 'Total Emails Processed',
            unique_id: 'smtp_aggregator_total_emails',
            state_topic: config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
            value_template: '{{ value_json.counts.total }}',
            device: deviceInfo,
            icon: 'mdi:email'
        });

        this.publishSensorDiscovery('queue_length', {
            name: 'Email Queue Length',
            unique_id: 'smtp_aggregator_queue_length',
            state_topic: config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
            value_template: '{{ value_json.queue.length }}',
            device: deviceInfo,
            icon: 'mdi:playlist-star'
        });

        this.publishSensorDiscovery('processing_time', {
            name: 'Average Processing Time',
            unique_id: 'smtp_aggregator_processing_time',
            state_topic: config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
            value_template: '{{ value_json.performance.averageProcessingTime }}',
            unit_of_measurement: 'ms',
            device: deviceInfo,
            icon: 'mdi:timer'
        });

        this.publishSensorDiscovery('success_rate', {
            name: 'Email Success Rate',
            unique_id: 'smtp_aggregator_success_rate',
            state_topic: config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
            value_template: '{{ value_json.performance.successRate }}',
            unit_of_measurement: '%',
            device: deviceInfo,
            icon: 'mdi:check-circle'
        });

        this.publishSensorDiscovery('failed_count', {
            name: 'Failed Emails Count',
            unique_id: 'smtp_aggregator_failed_count',
            state_topic: config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
            value_template: '{{ value_json.queue.failed }}',
            device: deviceInfo,
            icon: 'mdi:alert-circle'
        });

        this.publishSensorDiscovery('paired_emails', {
            name: 'Paired Emails Count',
            unique_id: 'smtp_aggregator_paired_emails',
            state_topic: config.options.mqtt_stats_topic || 'smtp_aggregator/stats',
            value_template: '{{ value_json.counts.paired }}',
            device: deviceInfo,
            icon: 'mdi:email-multiple'
        });
    }

    private publishSensorDiscovery(sensorType: string, config: any): void {
        const topic = `homeassistant/sensor/smtp_aggregator/${sensorType}/config`;
        this.publish(topic, config, { retain: true });
    }
}

export const mqtt = new MqttService();
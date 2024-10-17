export class RawMessage {
    id: string;
    isBlocked: boolean;
    simulatedErrorCount: number;
    bodyFilePath: string;

    constructor(id: string) {
        this.id = id;
        this.isBlocked = false;
        this.simulatedErrorCount = 0;
        this.bodyFilePath = ''; // This should be set properly in the actual implementation
    }

    async loadSimulatedErrorCount(): Promise<void> {
        // Implementation
    }

    block(): void {
        this.isBlocked = true;
    }

    async getHeader(): Promise<any | null> {
        // Implementation
    }

    async remove(): Promise<void> {
        // Implementation
    }
}
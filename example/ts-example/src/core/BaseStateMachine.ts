import { LogEntry, StateTransition, ViewModel, QueueEntry } from '../types/TastyFishBurger';

export abstract class BaseStateMachine {
    protected viewModel: ViewModel;
    protected transitionQueue: QueueEntry[] = [];
    protected isProcessing: boolean = false;

    constructor(protected name: string) {
        this.viewModel = {
            currentState: 'INITIAL',
            transitions: [],
            logEntries: [],
            isStable: true
        };
    }

    protected async processQueue(): Promise<void> {
        if (this.isProcessing || this.transitionQueue.length === 0) return;

        this.isProcessing = true;
        this.viewModel.isStable = false;

        try {
            const entry = this.transitionQueue[0];
            entry.status = 'PROCESSING';

            await this.processTransition(entry.transition);
            
            entry.status = 'COMPLETED';
            this.viewModel.transitions.push(entry.transition);
            this.viewModel.currentState = entry.transition.to;

            this.addLogEntry({
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                level: 'INFO',
                message: `Transition completed: ${entry.transition.from} -> ${entry.transition.to}`,
                metadata: { transition: entry.transition },
                viewModel: {}
            });

        } catch (error) {
            const entry = this.transitionQueue[0];
            entry.status = 'ERROR';
            entry.error = error instanceof Error ? error.message : 'Unknown error';

            this.addLogEntry({
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `Transition failed: ${entry.error}`,
                metadata: { transition: entry.transition, error: entry.error },
                viewModel: {}
            });
        }

        this.transitionQueue.shift();
        this.isProcessing = false;
        this.viewModel.isStable = this.transitionQueue.length === 0;

        if (this.transitionQueue.length > 0) {
            await this.processQueue();
        }
    }

    public async enqueueTransition(transition: StateTransition): Promise<void> {
        const entry: QueueEntry = {
            id: `queue-${Date.now()}`,
            stateMachine: this.name,
            transition,
            status: 'PENDING'
        };

        this.transitionQueue.push(entry);
        this.viewModel.isStable = false;

        this.addLogEntry({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `Transition queued: ${transition.from} -> ${transition.to}`,
            metadata: { transition },
            viewModel: {}
        });

        await this.processQueue();
    }

    public addLogEntry(entry: LogEntry): void {
        this.viewModel.logEntries.push(entry);
    }

    public isStable(): boolean {
        return this.viewModel.isStable;
    }

    public getCurrentState(): string {
        return this.viewModel.currentState;
    }

    public getViewModel(): ViewModel {
        return { ...this.viewModel };
    }

    protected abstract processTransition(transition: StateTransition): Promise<void>;
} 
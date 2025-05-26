import { ViewModel, StateTransition, LogEntry } from '../types/TastyFishBurger';

export class TastyFishBurgerMachine {
    private viewModel: ViewModel = {
        currentState: 'INITIAL',
        transitions: [],
        logEntries: [],
        isStable: true,
        hungry: false,
        burgersMade: 0,
        burgersEaten: 0,
        burgersTrashed: 0,
        burgersCooking: 0,
        burgersReady: 0,
        burgersEating: 0,
        burgersTrashing: 0,
    };

    constructor() {
        this.addLogEntry('INFO', 'TastyFishBurgerMachine initialized');
    }

    private addLogEntry(level: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata: Record<string, unknown> = {}) {
        const entry: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata
        };
        this.viewModel.logEntries.push(entry);
    }

    private addTransition(from: string, to: string) {
        const transition: StateTransition = {
            from,
            to,
            timestamp: new Date().toISOString()
        };
        this.viewModel.transitions.push(transition);
        this.viewModel.currentState = to;
    }

    protected states() {
        return [{
            "INITIAL": {
                "PREPARING": {
                    "COOKING": {
                        "READY": {}
                    }
                }
            },
            "PREPARING": {
                "COOKING": {
                    "EAT": {},
                    "READY": {}
                }
            },
            "READY": {},
            "EAT": {
                "PREPARING": {}
            },
            "TRASH": {
                "PREPARING": {}
            }
        }, {
            "INITIAL": (model, transition) => {
                return State(model, transition("PREPARING"))
            },
            "PREPARING": (model, transition) => {
                return State(model, transition("COOKING"))
            },
            "COOKING": (model, transition) => {
                if (view.isHungry()) {
                    return State(model, transition("EAT"))
                } else if (Math.random() < 0.1) {
                    return State(model, transition("TRASH"))
                }
                return State(model, transition("READY"))
            },
            "READY": (model, transition) => {
                return State(model, transition)
            },
            "TRASH": (model, transition) => {
                if (Math.random() < 0.5) {
                    return State(model, transition("EAT")) // it was just overcooked, i'll eat it :3
                }
                return State(model, transition("PREPARING"))
            },
            "EAT": (model, transition) => {
                if (Math.random() < 0.001) {
                    return State(model, transition("FIREEXTINGUISH")) // I WAS JUST HUNGRY SORRY, I'LLL MAKE ANOTHER, WHAAAT DONT FIRE ME COMMMEONNNNN
                }
                return State(model, transition("PREPARING"))
            },
            "ANXIOUS": (model, transition) => {
                return State(model, transition)
            },
            "FIREEXTINGUISH": (model, transition) => {
                return State(model, transition("ANXIOUS", this.sendMessage("~/BossManMachine/DONTFIRE")))
            }
        }]
    }

    public startCooking() {
        this.viewModel.isStable = false;
        this.addLogEntry('INFO', 'Starting to cook the fish burger');
        this.addTransition(this.viewModel.currentState, 'PREPARING');
        
        // Simulate cooking process
        setTimeout(() => {
            this.addTransition('PREPARING', 'COOKING');
            this.addLogEntry('INFO', 'Fish burger is cooking');
            
            setTimeout(() => {
                this.addTransition('COOKING', 'READY');
                this.addLogEntry('INFO', 'Fish burger is ready to eat!');
                this.viewModel.isStable = true;
            }, 2000);
        }, 1000);
    }

    public getViewModel(): ViewModel {
        return { ...this.viewModel };
    }
} 
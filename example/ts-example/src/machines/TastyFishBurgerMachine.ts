import { ViewModel, StateTransition, LogEntry } from '../types/TastyFishBurger';
import { BaseStateMachine, StateDefinition, StateHandler } from '../core/StateMachine';
import * as mori from 'mori';

export class TastyFishBurgerMachine extends BaseStateMachine {
    constructor() {
        super();
        this.addLogEntry('INFO', 'TastyFishBurgerMachine initialized');
    }

    protected addTransition(from: string, to: string) {
        const transition: StateTransition = {
            from,
            to,
            timestamp: new Date().toISOString()
        };
        this.viewModel.transitions.push(transition);
        this.viewModel.currentState = to;
    }

    protected states(): [StateDefinition, StateHandler] {
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
                return this.transition("PREPARING");
            },
            "PREPARING": (model, transition) => {
                return this.transition("COOKING");
            },
            "COOKING": (model, transition) => {
                const isHungry = mori.get(model, 'isHungry') as boolean;
                if (isHungry) {
                    return this.transition("EAT");
                } else if (Math.random() < 0.1) {
                    return this.transition("TRASH");
                }
                return this.transition("READY");
            },
            "READY": (model, transition) => {
                return this.transition("READY");
            },
            "TRASH": (model, transition) => {
                if (Math.random() < 0.5) {
                    return this.transition("EAT");
                }
                return this.transition("PREPARING");
            },
            "EAT": (model, transition) => {
                if (Math.random() < 0.001) {
                    return this.transition("FIREEXTINGUISH");
                }
                return this.transition("PREPARING");
            }
        }];
    }

    protected transition(to: string): StateTransition {
        const viewModel = this.getViewModel();
        const from = viewModel.currentState;
        this.addTransition(from, to);
        return { from, to, timestamp: new Date().toISOString() };
    }

    public startCooking() {
        this.setStable(false);
        this.addLogEntry('INFO', 'Starting to cook the fish burger');
        this.transition('PREPARING');
        
        setTimeout(() => {
            this.transition('COOKING');
            this.addLogEntry('INFO', 'Fish burger is cooking');
            
            setTimeout(() => {
                this.transition('READY');
                this.addLogEntry('INFO', 'Fish burger is ready to eat!');
                this.setStable(true);
            }, 2000);
        }, 1000);
    }

    public getViewModel(): ViewModel {
        return { ...this.viewModel };
    }
} 
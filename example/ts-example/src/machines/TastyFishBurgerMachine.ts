import { ViewModel, StateTransition, LogEntry } from '../types/TastyFishBurger';
import { createStateMachine, StateMachine, StateMachineConfig, StateDefinition } from '../core/StateMachine';
import * as mori from 'mori';

export interface TastyFishBurgerConfig {
    machineId: string;
    initialState?: string;
    isHungry?: boolean;
}

export interface TastyFishBurgerModel {
    isHungry: boolean;
    burgers: any[];
}

export type TastyFishBurgerFactory = (config: TastyFishBurgerConfig) => StateMachine<TastyFishBurgerConfig, TastyFishBurgerModel>;

const stateDefinitions: StateDefinition = {
    INITIAL: {
        PREPARING: {
            COOKING: {
                EAT: {},
                READY: {},
                TRASH: {}
            }
        }
    },
    TRASH: {
        EAT: {},
        PREPARING: {}
    },
    EAT: {
        PREPARING: {},
        FIREEXTINGUISH: {}
    }
};

export const TastyFishBurgerMachine = createStateMachine<TastyFishBurgerConfig, TastyFishBurgerModel>({
    defaultConfig: {
        machineId: 'tasty-fish-burger',
        initialState: 'INITIAL'
    },
    defaultViewModel: {
        isHungry: false,
        burgers: []
    },
    states: stateDefinitions
}).
withMethod('startCooking', ({machine, viewModel, transition, sendMessage}) => {
    viewModel.setStable(false);
    sendMessage('LOG', {
        level: 'INFO',
        message: 'Starting to cook the fish burger',
        metadata: { machineId: machine.config.machineId }
    });
    transition('PREPARING');
    
    setTimeout(() => {
        transition('COOKING');
        sendMessage('LOG', {
            level: 'INFO',
            message: 'Fish burger is cooking',
            metadata: { machineId: machine.config.machineId }
        });
        
        setTimeout(() => {
            transition('READY');
            sendMessage('LOG', {
                level: 'INFO',
                message: 'Fish burger is ready to eat!',
                metadata: { machineId: machine.config.machineId }
            });
            viewModel.setStable(true);
        }, 2000);
    }, 1000);
}).
withState('INITIAL', ({machine, viewModel, transition, sendMessage}) => {
    transition('PREPARING');
}).
withState('PREPARING', ({machine, viewModel, transition, sendMessage}) => {
    transition('COOKING');
}).
withState('COOKING', ({machine, viewModel, transition, sendMessage}) => {
    if (viewModel.isHungry) {
        transition('EAT');
    } else if (Math.random() < 0.1) {
        transition('TRASH');
    } else {
        transition('READY');
    }
}).
withState('READY', ({machine, viewModel, transition, sendMessage}) => {
    sendMessage('LOG', {
        level: 'INFO',
        message: 'Fish burger is ready to eat!',
        metadata: { machineId: machine.config.machineId },
        viewModel: {
            isHungry: true
        }
    });
}).
withState('TRASH', ({machine, viewModel, transition, sendMessage}) => {
    if (Math.random() < 0.5) {
        transition('EAT');
    } else {
        transition('PREPARING');
    }
}).
withState('EAT', ({machine, viewModel, transition, sendMessage}) => {
    if (Math.random() < 0.001) {
        transition('FIREEXTINGUISH');
    }
    sendMessage('LOG', {
        type: 'LOG',
        payload: {
            viewModel: {
                isHungry: false
            }
        }
    });
    transition('PREPARING');
}).
withState('FIREEXTINGUISH', ({machine, viewModel, transition, sendMessage}) => {
    // woooosh, and it's out
    transition('PREPARING');
});

export const createTastyFishBurger: TastyFishBurgerFactory = (config: TastyFishBurgerConfig) => {
    return createStateMachine<TastyFishBurgerConfig, TastyFishBurgerModel>({
        defaultConfig: config,
        defaultViewModel: {
            isHungry: config.isHungry || false,
            burgers: []
        },
        states: stateDefinitions
    });
}; 
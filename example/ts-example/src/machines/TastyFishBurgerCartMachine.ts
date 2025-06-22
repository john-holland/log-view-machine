import { ViewModel, StateTransition, LogEntry, CartItem } from '../types/TastyFishBurger';
import { createStateMachine, StateMachine, StateMachineConfig, StateDefinition } from '../core/StateMachine';
import { createTastyFishBurger, TastyFishBurgerConfig } from './TastyFishBurgerMachine';
import * as mori from 'mori';

export interface TastyFishBurgerCartConfig {
    machineId: string;
    initialState?: string;
}

export interface TastyFishBurgerCartModel extends ViewModel {
    burgers: CartItem[];
    subMachines: {
        TastyFishBurgerMachine: StateMachine<TastyFishBurgerConfig, any>;
    };
}

export type TastyFishBurgerCartFactory = (config: TastyFishBurgerCartConfig) => StateMachine<TastyFishBurgerCartConfig, TastyFishBurgerCartModel>;

const stateDefinitions: StateDefinition = {
    INITIAL: {
        EMPTY: {
            BURGERS: {
                EAT: {
                    INITIAL: {}
                }
            }
        }
    },
    EMPTY: {
        BURGERS: {
            EAT: {
                INITIAL: {}
            }
        }
    },
    BURGERS: {
        EAT: {
            INITIAL: {}
        }
    },
    FETCH_BURGERS: {
        BURGERS: {
            EAT: {
                INITIAL: {}
            }
        }
    }
};

const TastyFishBurgerCartMachine = createStateMachine<TastyFishBurgerCartConfig, TastyFishBurgerCartModel>({
    defaultConfig: {
        machineId: 'tasty-fish-burger-cart',
        initialState: 'INITIAL'
    },
    defaultViewModel: {
        burgers: [],
        subMachines: {
            TastyFishBurgerMachine: createTastyFishBurger({
                machineId: 'tasty-fish-burger',
                initialState: 'INITIAL'
            })
        },
        currentState: 'INITIAL',
        transitions: [],
        logEntries: [],
        isStable: true
    },
    states: stateDefinitions
}).
withState('INITIAL', ({machine, viewModel, transition, sendMessage}) => {
    // Start burger machine
    viewModel.subMachines.TastyFishBurgerMachine.transition('PREPARING');
    transition('PREPARING');
}).
withState('PREPARING', ({machine, viewModel, transition, sendMessage}) => {
    transition('COOKING');
}).
withState('COOKING', ({machine, viewModel, transition, sendMessage}) => {
    transition('READY');
}).
withState('ADD_TO_CART', ({machine, viewModel, transition, sendMessage}) => {
    sendMessage('LOG', {
        level: 'INFO',
        message: 'Burger added to cart',
        metadata: { machineId: machine.config.machineId },
        viewModel: {
            burgers: [...viewModel.burgers, {
                id: Date.now().toString(),
                burger: viewModel.subMachines.TastyFishBurgerMachine.getViewModel(),
                quantity: 1
            }]
        }
    });
    transition('READY');
}).
withState('ANOTHER', ({machine, viewModel, transition, sendMessage}) => {
    viewModel.subMachines.TastyFishBurgerMachine.transition('PREPARING');
    transition('PREPARING');
}).
withState('EAT', ({machine, viewModel, transition, sendMessage}) => {
    sendMessage('LOG', {
        level: 'INFO',
        message: 'Burgers eaten!',
        metadata: { machineId: machine.config.machineId },
        viewModel: {
            burgers: []
        }
    });
    transition('PREPARING');
}).
withState('TRASH', ({machine, viewModel, transition, sendMessage}) => {
    if (Math.random() > 0.9) {
        sendMessage('LOG', {
            level: 'INFO',
            message: 'Aw, this was just overcooked. I\'ll just eat it. Ow hot hot hot, oh so good! Arugala save me!',
            metadata: { machineId: machine.config.machineId },
            viewModel: {
                burgers: []
            }
        });
        transition('EAT');
        return;
    }

    sendMessage('LOG', {
        level: 'INFO',
        message: 'Burgers trashed!',
        metadata: { machineId: machine.config.machineId },
        viewModel: {
            burgers: []
        }
    });
    transition('INITIAL');
}).
withGraphQLState('FETCH_BURGERS', 'query', async ({ machine, viewModel, transition, sendMessage, graphql }) => {
    try {
        const result = await graphql.query({
            query: `
                query GetBurgers {
                    burgers {
                        id
                        name
                        price
                        ingredients
                    }
                }
            `
        });

        sendMessage('LOG', {
            level: 'INFO',
            message: 'Burgers fetched successfully',
            metadata: { machineId: machine.config.machineId },
            viewModel: {
                burgers: result.data.burgers.map((burger: any) => ({
                    id: burger.id,
                    burger: {
                        name: burger.name,
                        price: burger.price,
                        ingredients: burger.ingredients
                    },
                    quantity: 1
                }))
            }
        });

        transition('BURGERS');
    } catch (error) {
        sendMessage('LOG', {
            level: 'ERROR',
            message: 'Failed to fetch burgers',
            metadata: { 
                machineId: machine.config.machineId,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });
        transition('EMPTY');
    }
});

export const createTastyFishBurgerCart: TastyFishBurgerCartFactory = (config: TastyFishBurgerCartConfig) => {
    return createStateMachine<TastyFishBurgerCartConfig, TastyFishBurgerCartModel>({
        defaultConfig: config,
        defaultViewModel: {
            burgers: [],
            subMachines: {
                TastyFishBurgerMachine: createTastyFishBurger({
                    machineId: 'tasty-fish-burger',
                    initialState: 'INITIAL'
                })
            },
            currentState: 'INITIAL',
            transitions: [],
            logEntries: [],
            isStable: true
        },
        states: stateDefinitions
    });
}; 
import React, { useEffect, useState } from 'react';
import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';
import { ViewModel, StateMachineUpdate, MessageUpdate } from '../types/TastyFishBurger';

interface ViewMachineComponentProps<T extends { getViewModel(): ViewModel }> {
    stateMachine: T;
    render: (viewModel: ViewModel) => React.ReactNode;
    onError?: (error: Error) => void;
}

const STATE_MACHINE_UPDATES = gql`
    subscription OnStateMachineUpdate {
        stateMachineUpdate {
            id
            currentState
            transitions {
                from
                to
                timestamp
            }
            logEntries {
                id
                timestamp
                level
                message
                metadata
            }
            isStable
        }
    }
`;

const MESSAGE_UPDATES = gql`
    subscription OnMessageUpdate {
        messageUpdate {
            id
            content
            timestamp
        }
    }
`;

export function ViewMachineComponent<T extends { getViewModel(): ViewModel }>({
    stateMachine,
    render,
    onError
}: ViewMachineComponentProps<T>) {
    const [localViewModel, setLocalViewModel] = useState<ViewModel>(stateMachine.getViewModel());

    // Subscribe to state machine updates
    const { data: stateMachineData, error: stateMachineError } = useSubscription<{
        stateMachineUpdate: StateMachineUpdate;
    }>(STATE_MACHINE_UPDATES);

    // Subscribe to message updates
    const { data: messageData, error: messageError } = useSubscription<{
        messageUpdate: MessageUpdate;
    }>(MESSAGE_UPDATES);

    useEffect(() => {
        if (stateMachineError && onError) {
            onError(stateMachineError);
        }
    }, [stateMachineError, onError]);

    useEffect(() => {
        if (messageError && onError) {
            onError(messageError);
        }
    }, [messageError, onError]);

    useEffect(() => {
        if (stateMachineData?.stateMachineUpdate) {
            setLocalViewModel((prev: ViewModel) => ({
                ...prev,
                ...stateMachineData.stateMachineUpdate
            }));
        }
    }, [stateMachineData]);

    useEffect(() => {
        if (messageData?.messageUpdate) {
            setLocalViewModel((prev: ViewModel) => ({
                ...prev,
                logEntries: [
                    ...prev.logEntries,
                    {
                        id: messageData.messageUpdate.id,
                        timestamp: messageData.messageUpdate.timestamp,
                        level: 'INFO',
                        message: messageData.messageUpdate.content,
                        metadata: {}
                    }
                ]
            }));
        }
    }, [messageData]);

    if (!localViewModel.isStable) {
        return <div>Loading...</div>;
    }

    return <>{render(localViewModel)}</>;
}

// Example usage with TastyFishBurgerView
interface TastyFishBurgerViewProps {
    stateMachine: { getViewModel(): ViewModel };
}

export function TastyFishBurgerView({ stateMachine }: TastyFishBurgerViewProps) {
    return (
        <ViewMachineComponent
            stateMachine={stateMachine}
            render={(viewModel) => (
                <div>
                    <h2>Current State: {viewModel.currentState}</h2>
                    <h3>Recent Transitions:</h3>
                    <ul>
                        {viewModel.transitions.slice(-5).map((transition) => (
                            <li key={transition.timestamp}>
                                {transition.from} → {transition.to}
                            </li>
                        ))}
                    </ul>
                    <h3>Latest Log Entry:</h3>
                    {viewModel.logEntries.length > 0 && (
                        <div>
                            <p>{viewModel.logEntries[viewModel.logEntries.length - 1].message}</p>
                        </div>
                    )}
                </div>
            )}
            onError={(error) => console.error('Error in TastyFishBurgerView:', error)}
        />
    );
} 
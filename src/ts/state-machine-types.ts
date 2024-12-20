import State, {StateResolution} from "./state";
import PriorityQueue from "./util/priority-queue";

// the state becomes a named remote procedure call
// the data must stay fairly generic,
//      but should consider serialization if network transport is to be trusted

type Transition<T extends State> = {
    from: T
    to: T
    send: Date
    received: Date | undefined
}

type Message<TData extends any, TState extends State> = Transition<TState> & {
    data: TData
    csrfToken: string
}

type Location = String & {
    isLocal: boolean
    requiresAdapter: boolean
}

type Resolved<TData extends any, TState extends State> = Message<TData, TState> & {
    resolution: StateResolution
    asynchronousMessages: Resolved<TData, TState>[]
}

type Machine<TData extends any, TState extends State> = {
    name: string

    superMachine: string
    subMachines:  Machine<TData, TState>[]
    location: string | Location

    currentState: Transition<State>
    processing: boolean
    queue: PriorityQueue<Transition<State>>

    currentModel: TData
    log: Resolved<TData, TState>[]
}

// @todd-o: todo: review: to make re-hydrate-able use action queue
// todo: review:   with the previous Resolved.resolution behind the last view, (including async calls)
// todo: review:   or seeing a Clear return to a 'base' state.

type ViewMachine<TData extends any, TState extends State, TViewType extends any> = {
    currentView: TViewType
}

// @todd-o: todo: review: graphql implications beyond APIAdapters
//     https://graphql.org/learn/authorization/
//     https://graphql.org/learn/global-object-identification/
// @todd-o: todo: review: graphql addressing scheme?

// todo: add observables
// type Machine { observeable: Observeable<State | undefined> }


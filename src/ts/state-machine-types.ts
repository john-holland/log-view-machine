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
    requestId: string
    requestToken: string
    id: string // guid
    salt: string // for the boars, we may just get away with encaspulated csrfToken
                 // but in case of deeper corruption *Batman sighs, tapping his fingers*,
                 // we *clears throat* may want
    hash: string // 8// meow!

    /*
    *
    * two message brokers should be used to ensure consistent graph introspection
    * one message broker for header information and metrics / request traces
    * one message broker for working requests
    *
    * if each iteration of a message was stored sequentially renewing a csrf token
    * and request ids for the request, and citing the original csrf token
    *
    * site csrfToken --> app001 (ex "csrf:8bca11b3-5099-4f0f-b22c-75c531804a45")
    *     "init" --> csrf token "csrf:8bca11b3-5099-4f0f-b22c-75c531804a45"
    *                request id "init:3619e191-9887-4cc3-8eb4-cd37db862f5b"
    *                request token "request:220d3f9c-aada-41ed-8774-f7f5560e232e"
    *           "load settings" --> "" (csrf from top, request token "220d3f9c...")
    *                               request token "request:ef6b3e57-1486-479d-a8bd-ef7ac04bc848"
    *           return:
    *               requires csrf = "8bca11..." / request token = "ef6b3e57..."
    *           "start" --> "" (csrf from top, request token "220d3f9c...")
    *                       request token "request: 8961788f-2803-40ca-a4f1-539342da65b4"
    *               "content/wave/start" --> "" (csrf from top, request token "8961788f...")
    *                                        request token --> "request: 21bc3313-3ba0-4b94-9041-791c77d65810"
    *           return:
    *               requires csrf = "8bca11..." / request token = "8961..."
    *      return:
    *          requires csrf = "8bca11..." / request token = "220d3f9c..."
    *
    *
    * metrics log:
    *   id, request, tokens
    *   return:
    *      id, response, tokens
    *
    *
    * fly wheel pattern for a tree of machines and submachines
    *
    * */
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
    processing:  boolean
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


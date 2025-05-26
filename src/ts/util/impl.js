import State, {StateResolution} from "../state";
import PriorityQueue from "./priority-queue";


class State {
    name= "unnamed"
    ventureStates = []//string[] | undefined
    previousStates = []//string[] | undefined
    modelType = undefined //string
    localFn = (data) /* StateResolution */ => {
        return Resolution.Log("state function called with no override")
    }

    constructor() {

    }
}

class StateResolution {
    name = ""
    constructor(name = "unnamed") {
        this.name = name;
    }
}

class LogResolution extends StateResolution {
    name = "log"
    data = undefined
    constructor(data = TData) {
        super(name)
        this.data = data;
    }
}

class ViewResolution extends StateResolution {
    name = "view"
    view= undefined
    constructor(view = TView) {
        super(name)
        this.view = view;
    }
}

class ClearResolution extends StateResolution {
    name = "clear"
    dataClear = undefined

    constructor(dataClear = TDataClear | undefined) {
        super(name)
        this.dataClear = dataClear;
    }
}

class Resolution {
    static Log(data) {
        return new LogResolution(data);
    }

    static View(view) {
        return new ViewResolution(view);
    }

    static Clear(clear) {
        return new ClearResolution(clear);
    }

    static Clearer() {
        return new ClearResolution(undefined);
    }
}


const Transition = ({
    from,
    to,
    send,
    received
}) => {
    return {
        from,
        to,
        send: send || (new Date().getTime()),
        received: received || undefined
    }
}

const Message = ({
    data,
    csrfToken
}) => {
    return {
        data,
        csrfToken
    }
}

const boolean = false;
const Location = /* String & */ ({
    value,
    isLocal,
    requiresAdapter
}) => {
    const returnValue = {
        value,
        isLocal: isLocal || false,
        requiresAdapter: requiresAdapter || false,
        // String & behavior
        valueOf: () => {
            return returnValue.value;
        }
    }

    return returnValue;
}

const Resolved = ({
    resolution, //StateResolution
    asynchronousMessages //Resolved<TData, TState>[]
}) => {
    return {
        resolution,
        asynchronousMessages: asynchronousMessages || []
    }
}

const Machine = ({
    name,// string
    stateMap: {},

    superMachine,// string
    subMachines,//  Machine<TData, TState>[]
    location,// string | Location

    currentState,// Transition<State>
    processing,// boolean
    queue,// PriorityQueue<Transition<State>>

    currentModel,// TData
    log,// Resolved<TData, TState>[]
}) => {
    return {
        name,
        stateMap,
        superMachine,
        location,
        currentState,
        processing,
        queue,
        currentModel,
        log
    }
}

const ProxyMachine = ({

})

export const MachineService = ({ existingMap = new Set() }) => {
    const map = new Map(existingMap);
    const proxyMap = new Map(map);
    const location = "content"
    return {
        findMachine: async (name, location) => {
            // a proxy machine should be returned with network requests
            // ### service discoverability
            // address scheme: local machine
            // `               local machine/submachine
            //                 local machine/../supermachine/submachine

        }
    }
}

// @todd-o: todo: review: to make re-hydrate-able use action queue
// todo: review:   with the previous Resolved.resolution behind the last view, (including async calls)
// todo: review:   or seeing a Clear return to a 'base' state.

export const ViewMachine /*<TData extends any, TState extends State, TViewType extends any>*/ = () => {
    const currentView = undefined;
    const log = machine.log;
    let view = [];

    return {
        // todo: make compat with resolution switch or match
        clear: () => { machine.log = [] },
        log: (data) => {
            machine.log.push(data);
        },
        view: (view) => {
            view.push(view);
        },
        // render: (stateMachine) => {
        //     return stateMachine.
        // }
    }

}

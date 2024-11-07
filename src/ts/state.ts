
export type StateResolution = {
    readonly name: string
}

export class LogResolution<TData extends any> implements StateResolution {
    name = "log"
    data: TData
    constructor(data: TData) {
        this.data = data;
    }
}

export class ViewResolution<TView extends any> implements StateResolution {
    name = "view"
    view: TView
    constructor(view: TView) {
        this.view = view;
    }
}

export class ClearResolution<TDataClear extends any> implements StateResolution {
    name = "clear"

    dataClear: TDataClear | undefined
    constructor(dataClear: TDataClear | undefined) {
        this.dataClear = dataClear;
    }
}

export class Resolution {
    public static Log<TData extends any>(data: TData): StateResolution {
        return new LogResolution<TData>(data);
    }

    public static View<TView>(view: TView): StateResolution {
        return new ViewResolution<TView>(view);
    }

    public static Clear<TDataClear extends any | undefined>(clear: TDataClear) {
        return new ClearResolution<TDataClear>(clear);
    }

    public static Clearer<TDataClear extends any | undefined>() {
        return new ClearResolution<TDataClear>(undefined);
    }
}

export type State = {
    name: string
    ventureStates: string[] | undefined
    previousStates: string[] | undefined
    modelType: string
    localFn: { (data: any): StateResolution }
}

export default State;

export class ModelError implements Error {
    name: string
    message: string
    stack?: string

    constructor(name: string, message?: string, stack?: string) {
        this.name = name;
        this.message = message || name || "undefined"
        this.stack = stack

        // tempting but maybe bad for pii
        //if (stack) console.trace(stack)
    }
}

export class ExampleState implements State {
    // wooo
    modelType: string;
    name: string = "state-name"
    ventureStates: string[]
    previousStates: string[]

    localFn = (data: any) => {
        console.log(data);
        return Resolution.View("woo")
    }

    constructor(attributes: Partial<State> = {}) {
        this.modelType = attributes.modelType;
        this.name = attributes.name;
        this.ventureStates = attributes.ventureStates;
        this.previousStates = attributes.previousStates;
    }
}
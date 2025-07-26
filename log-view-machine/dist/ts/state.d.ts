export type StateResolution = {
    readonly name: string;
};
export declare class LogResolution<TData extends any> implements StateResolution {
    name: string;
    data: TData;
    constructor(data: TData);
}
export declare class ViewResolution<TView extends any> implements StateResolution {
    name: string;
    view: TView;
    constructor(view: TView);
}
export declare class ClearResolution<TDataClear extends any> implements StateResolution {
    name: string;
    dataClear: TDataClear | undefined;
    constructor(dataClear: TDataClear | undefined);
}
export declare class Resolution {
    static Log<TData extends any>(data: TData): StateResolution;
    static View<TView>(view: TView): StateResolution;
    static Clear<TDataClear extends any | undefined>(clear: TDataClear): ClearResolution<TDataClear>;
    static Clearer<TDataClear extends any | undefined>(): ClearResolution<TDataClear>;
}
export type State = {
    name: string;
    ventureStates: string[] | undefined;
    previousStates: string[] | undefined;
    modelType: string;
    localFn: {
        (data: any): StateResolution;
    };
};
export default State;
export declare class ModelError implements Error {
    name: string;
    message: string;
    stack?: string;
    constructor(name: string, message?: string, stack?: string);
}
export declare class ExampleState implements State {
    modelType: string;
    name: string;
    ventureStates: string[];
    previousStates: string[];
    localFn: (data: any) => StateResolution;
    constructor(attributes?: Partial<State>);
}
export declare const ViewMachine: {};

export class LogResolution {
    constructor(data) {
        this.name = "log";
        this.data = data;
    }
}
export class ViewResolution {
    constructor(view) {
        this.name = "view";
        this.view = view;
    }
}
export class ClearResolution {
    constructor(dataClear) {
        this.name = "clear";
        this.dataClear = dataClear;
    }
}
export class Resolution {
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
export class ModelError {
    constructor(name, message, stack) {
        this.name = name;
        this.message = message || name || "undefined";
        this.stack = stack;
        // tempting but maybe bad for pii
        //if (stack) console.trace(stack)
    }
}
export class ExampleState {
    constructor(attributes = {}) {
        this.name = "state-name";
        this.localFn = (data) => {
            console.log(data);
            return Resolution.View("woo");
        };
        this.modelType = attributes.modelType;
        this.name = attributes.name;
        this.ventureStates = attributes.ventureStates;
        this.previousStates = attributes.previousStates;
    }
}
export const ViewMachine = {};

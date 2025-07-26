export class Subject {
    constructor() {
        this.observers = [];
        this.completed = false;
        this.errorState = null;
    }
    next(value) {
        if (this.completed || this.errorState)
            return;
        this.observers.forEach(observer => observer.next(value));
    }
    error(error) {
        if (this.completed)
            return;
        this.errorState = error;
        this.observers.forEach(observer => observer.error(error));
    }
    complete() {
        if (this.completed || this.errorState)
            return;
        this.completed = true;
        this.observers.forEach(observer => observer.complete());
    }
    subscribe(observer) {
        if (this.errorState) {
            observer.error(this.errorState);
            return { unsubscribe: () => { } };
        }
        if (this.completed) {
            observer.complete();
            return { unsubscribe: () => { } };
        }
        this.observers.push(observer);
        return {
            unsubscribe: () => {
                const index = this.observers.indexOf(observer);
                if (index !== -1) {
                    this.observers.splice(index, 1);
                }
            }
        };
    }
}
export class BehaviorSubject extends Subject {
    constructor(initialValue) {
        super();
        this.currentValue = initialValue;
    }
    getValue() {
        return this.currentValue;
    }
    next(value) {
        this.currentValue = value;
        super.next(value);
    }
    subscribe(observer) {
        observer.next(this.currentValue);
        return super.subscribe(observer);
    }
}

export interface Observer<T> {
    next(value: T): void;
    error(error: Error): void;
    complete(): void;
}
export interface Subscription {
    unsubscribe(): void;
}
export interface Observable<T> {
    subscribe(observer: Observer<T>): Subscription;
}
export declare class Subject<T> implements Observable<T>, Observer<T> {
    private observers;
    private completed;
    private errorState;
    next(value: T): void;
    error(error: Error): void;
    complete(): void;
    subscribe(observer: Observer<T>): Subscription;
}
export declare class BehaviorSubject<T> extends Subject<T> {
    private currentValue;
    constructor(initialValue: T);
    getValue(): T;
    next(value: T): void;
    subscribe(observer: Observer<T>): Subscription;
}

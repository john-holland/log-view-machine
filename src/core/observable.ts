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

export class Subject<T> implements Observable<T>, Observer<T> {
  private observers: Observer<T>[] = [];
  private completed = false;
  private errorState: Error | null = null;

  next(value: T): void {
    if (this.completed || this.errorState) return;
    this.observers.forEach(observer => observer.next(value));
  }

  error(error: Error): void {
    if (this.completed) return;
    this.errorState = error;
    this.observers.forEach(observer => observer.error(error));
  }

  complete(): void {
    if (this.completed || this.errorState) return;
    this.completed = true;
    this.observers.forEach(observer => observer.complete());
  }

  subscribe(observer: Observer<T>): Subscription {
    if (this.errorState) {
      observer.error(this.errorState);
      return { unsubscribe: () => {} };
    }

    if (this.completed) {
      observer.complete();
      return { unsubscribe: () => {} };
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

export class BehaviorSubject<T> extends Subject<T> {
  private currentValue: T;

  constructor(initialValue: T) {
    super();
    this.currentValue = initialValue;
  }

  getValue(): T {
    return this.currentValue;
  }

  next(value: T): void {
    this.currentValue = value;
    super.next(value);
  }

  subscribe(observer: Observer<T>): Subscription {
    observer.next(this.currentValue);
    return super.subscribe(observer);
  }
} 
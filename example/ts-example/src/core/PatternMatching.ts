type Pattern<T, R> = {
    when: (predicate: (value: T) => boolean) => Pattern<T, R>;
    otherwise: (handler: (value: T) => R) => R;
    match: (handler: (value: T) => R) => Pattern<T, R>;
};

export class Match<T> {
    private value: T;
    private patterns: Array<{
        predicate: (value: T) => boolean;
        handler: (value: T) => any;
    }> = [];

    constructor(value: T) {
        this.value = value;
    }

    when(predicate: (value: T) => boolean): Pattern<T, any> {
        return {
            when: (nextPredicate: (value: T) => boolean) => {
                this.patterns.push({ predicate: nextPredicate, handler: () => null });
                return this;
            },
            match: (handler: (value: T) => any) => {
                this.patterns.push({ predicate, handler });
                return this;
            },
            otherwise: (handler: (value: T) => any) => {
                this.patterns.push({ predicate: () => true, handler });
                return this.evaluate();
            }
        };
    }

    private evaluate(): any {
        for (const { predicate, handler } of this.patterns) {
            if (predicate(this.value)) {
                return handler(this.value);
            }
        }
        throw new Error('No matching pattern found');
    }
}

export function match<T>(value: T): Pattern<T, any> {
    return new Match(value).when(() => true);
}

// Type-safe pattern matching for state transitions
export type StatePattern<T, R> = {
    [K in keyof T]: (value: T[K]) => R;
};

export function matchState<T extends Record<string, any>, R>(
    value: T,
    patterns: StatePattern<T, R>
): R {
    const state = Object.keys(value)[0];
    const stateValue = value[state];
    
    if (state in patterns) {
        return patterns[state](stateValue);
    }
    
    throw new Error(`No pattern found for state: ${state}`);
} 
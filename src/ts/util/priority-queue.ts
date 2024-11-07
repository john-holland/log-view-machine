
export type SortByPredicate<T> = { (a: T, b: T): number }

export default class PriorityQueue<T> {
    private queue: T[]
    private sortBy: SortByPredicate<T>
    private autoInitialize: boolean
    private hasAutoInitialized: boolean = false

    /**
     @todd-o: todo: review: give an option for ascending and require descending?
     @todd-o: todo: review: if the inserted value equals should we enqueue or push?

      rust engineers are probably talking about passing the AST by value in a block or something cheesy...
      meow :(

     @todd-o: todo: review: could you toString() from string? What about functor combinators?

     @todd-o: @cbd: todo: review: should we include a sortBy override for the enqueue function?
     **/

    constructor(queue: T[], sortBy: SortByPredicate<T>, autoInitialize: boolean = false) {
        this.queue = queue;
        this.sortBy = sortBy
        this.autoInitialize = autoInitialize
    }

    private initialize(): void {
        if (!this.hasAutoInitialized && this.autoInitialize) {
            this.hasAutoInitialized = true;
            this.queue.sort(this.sortBy)
        }
    }

    public enqueue(value: T) {
        this.initialize()

        this.queue.unshift(value)
        this.queue.sort(this.sortBy);
    }
    public peek(): T | undefined {
        this.initialize()

        return this.queue.length > 0 ? this.queue[this.queue.length - 1] : undefined;
    }
    public dequeue(): T | undefined {
        this.initialize()

        const dequeued= this.queue.pop()
        this.queue.sort(this.sortBy);
        return dequeued
    }
}

const AscTest = () => {
    type DateObj = {
        date: Date
    }
    const queue = new PriorityQueue<DateObj>([],
        (a, { date }) => a.date.getTime() < date.getTime() ? 1 : -1);
    const current = new Date();
    queue.enqueue({ date: current })
    queue.enqueue({ date: new Date(2000, 1,1,1,1,1,1) })
    queue.enqueue({ date: new Date(2001, 1,1,1,1,1,1) })

    if (queue.dequeue()?.date.getFullYear() !== 2000) throw new Error("first in first out should imply Y2K comes out first when dequeued")
}

const DescTest = () => {
    type DateObj = {
        date: Date
    }
    const queue = new PriorityQueue<DateObj>([],
        (a, { date }) => a.date.getTime() > date.getTime() ? 1 : -1);
    const current = new Date();
    queue.enqueue({ date: current })
    queue.enqueue({ date: new Date(2000, 1,1,1,1,1,1) })
    queue.enqueue({ date: new Date(1999, 1,1,1,1,1,1) })

    if (queue.dequeue()?.date.getFullYear() !== current.getFullYear()) throw new Error("first in first out should imply Y2K comes out last when dequeued")
}

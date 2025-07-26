export type SortByPredicate<T> = {
    (a: T, b: T): number;
};
export default class PriorityQueue<T> {
    private queue;
    private sortBy;
    private autoInitialize;
    private hasAutoInitialized;
    /**
     @todd-o: todo: review: give an option for ascending and require descending?
     @todd-o: todo: review: if the inserted value equals should we enqueue or push?

      rust engineers are probably talking about passing the AST by value in a block or something cheesy...
      meow :(

     @todd-o: todo: review: could you toString() from string? What about functor combinators?

     @todd-o: @cbd: todo: review: should we include a sortBy override for the enqueue function?
     **/
    constructor(queue: T[], sortBy: SortByPredicate<T>, autoInitialize?: boolean);
    private initialize;
    enqueue(value: T): void;
    peek(): T | undefined;
    dequeue(): T | undefined;
}

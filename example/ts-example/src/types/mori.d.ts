declare module 'mori' {
    export function hash_map(...args: any[]): any;
    export function vector(...args: any[]): any;
    export function get(map: any, key: string): any;
    export function assoc(map: any, key: string, value: any): any;
    export function update_in(map: any, path: string[], fn: (value: any) => any): any;
    export function conj(collection: any, value: any): any;
    export function toJs(collection: any): any;
} 
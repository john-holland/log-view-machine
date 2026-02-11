declare module 'memjs' {
  export interface Client {
    get(key: string): Promise<{ value: Buffer | null }>;
    set(key: string, value: string, opts?: unknown): Promise<boolean>;
    close(): void;
  }
  export const Client: { create(servers?: string): Client };
}

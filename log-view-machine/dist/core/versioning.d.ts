export interface VersionConstraint {
    minVersion?: string;
    maxVersion?: string;
    exactVersion?: string;
}
export interface VersionedMachine {
    version: string;
    machine: any;
    constraints?: VersionConstraint;
}
export declare function satisfiesVersion(version: string, constraint: VersionConstraint): boolean;

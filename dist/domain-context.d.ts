export interface DomainContext {
    userId: string;
}
export declare class DevDomainContext implements DomainContext {
    readonly userId: string;
}
export declare class SystemDomainContext implements DomainContext {
    readonly userId: string;
}

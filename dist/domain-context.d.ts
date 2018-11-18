export interface DomainContext {
    user: string;
}
export declare class DevDomainContext implements DomainContext {
    readonly user: string;
}
export declare class SystemDomainContext implements DomainContext {
    readonly user: string;
}

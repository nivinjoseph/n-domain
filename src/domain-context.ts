// public
export interface DomainContext
{
    user: string;
}

// public
export class DevDomainContext implements DomainContext
{
    public get user(): string { return "dev"; }
}

// public
export class SystemDomainContext implements DomainContext
{
    public get user(): string { return "system"; }
}
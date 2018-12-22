// public
export interface DomainContext
{
    userId: string;
}

// public
export class DevDomainContext implements DomainContext
{
    public get userId(): string { return "dev"; }
}

// public
export class SystemDomainContext implements DomainContext
{
    public get userId(): string { return "system"; }
}
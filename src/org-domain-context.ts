import { DomainContext } from "./domain-context.js";

export interface OrgDomainContext extends DomainContext
{
    readonly organizationId: string;
}
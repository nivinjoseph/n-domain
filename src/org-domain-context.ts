import { DomainContext } from "./domain-context.js";

/** Domain context carrying the acting organization in addition to the acting user. */
export interface OrgDomainContext extends DomainContext
{
    readonly organizationId: string;
}
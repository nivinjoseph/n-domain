import { DomainEventData } from "./domain-event-data.js";

export interface OrgDomainEventData extends DomainEventData
{
    $organizationId?: string;
}
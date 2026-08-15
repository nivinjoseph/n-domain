import { DomainEventData } from "./domain-event-data.js";

/** Serialized shape of an `OrgDomainEvent`: `DomainEventData` plus `$organizationId`. */
export interface OrgDomainEventData extends DomainEventData
{
    $organizationId?: string;
}
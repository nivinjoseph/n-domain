import { OrgAggregateState } from "./org-aggregate-state.js";
import { DomainEvent } from "./domain-event.js";
import { OrgDomainEventData } from "./org-domain-event-data.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgAggregateRoot } from "./org-aggregate-root.js";
/**
 * Organization-scoped domain event: serializes `$organizationId` and, on apply, throws
 * `ApplicationException` if the event's `organizationId` does not match the state's.
 */
export declare abstract class OrgDomainEvent<T extends OrgAggregateState> extends DomainEvent<T> {
    private _organizationId;
    get organizationId(): string;
    constructor(data: OrgDomainEventData);
    apply(aggregate: OrgAggregateRoot<T, OrgDomainEvent<T>>, domainContext: OrgDomainContext, state: T): void;
}
//# sourceMappingURL=org-domain-event.d.ts.map
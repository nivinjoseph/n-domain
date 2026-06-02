import { OrgAggregateState } from "./org-aggregate-state.js";
import { DomainEvent } from "./domain-event.js";
import { OrgDomainEventData } from "./org-domain-event-data.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgAggregateRoot } from "./org-aggregate-root.js";
export declare abstract class OrgDomainEvent<T extends OrgAggregateState> extends DomainEvent<T> {
    private _organizationId;
    get organizationId(): string;
    constructor(data: OrgDomainEventData);
    apply(aggregate: OrgAggregateRoot<T>, domainContext: OrgDomainContext, state: T): void;
}
//# sourceMappingURL=org-domain-event.d.ts.map
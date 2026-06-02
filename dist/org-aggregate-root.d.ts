import { AggregateRoot } from "./aggregate-root.js";
import { OrgAggregateStateFactory } from "./org-aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgDomainEvent } from "./org-domain-event.js";
export declare abstract class OrgAggregateRoot<T extends OrgAggregateState> extends AggregateRoot<T, OrgDomainEvent<T>> {
    get organizationId(): string;
    protected constructor(domainContext: OrgDomainContext, events: ReadonlyArray<OrgDomainEvent<T>>, stateFactory: OrgAggregateStateFactory<T>, state?: T);
    protected applyEvent(event: OrgDomainEvent<T>): void;
}
//# sourceMappingURL=org-aggregate-root.d.ts.map
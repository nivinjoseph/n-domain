import { AggregateRoot } from "./aggregate-root.js";
import { OrgAggregateStateFactory } from "./org-aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgDomainEvent } from "./org-domain-event.js";
export declare abstract class OrgAggregateRoot<T extends OrgAggregateState, TDomainEvent extends OrgDomainEvent<T>> extends AggregateRoot<T, TDomainEvent> {
    get organizationId(): string;
    protected constructor(domainContext: OrgDomainContext, events: ReadonlyArray<OrgDomainEvent<T>>, stateFactory: OrgAggregateStateFactory<T>, state?: T);
    protected applyEvent(event: TDomainEvent): void;
}
//# sourceMappingURL=org-aggregate-root.d.ts.map
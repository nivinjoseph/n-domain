import { given } from "@nivinjoseph/n-defensive";
import { AggregateRoot } from "./aggregate-root.js";
import { OrgAggregateStateFactory } from "./org-aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgDomainEvent } from "./org-domain-event.js";

export abstract class OrgAggregateRoot<T extends OrgAggregateState> extends AggregateRoot<T, OrgDomainEvent<T>>
{
    public get organizationId(): string { return this.state.organizationId; }


    protected constructor(domainContext: OrgDomainContext, events: ReadonlyArray<OrgDomainEvent<T>>,
        stateFactory: OrgAggregateStateFactory<T>, state?: T)
    {
        super(domainContext, events, stateFactory, state);
    }


    protected override applyEvent(event: OrgDomainEvent<T>): void
    {
        given(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(OrgDomainEvent);

        super.applyEvent(event);
    }
}
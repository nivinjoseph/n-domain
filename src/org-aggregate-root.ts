import { given } from "@nivinjoseph/n-defensive";
import { AggregateRoot } from "./aggregate-root.js";
import { OrgAggregateStateFactory } from "./org-aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgDomainEvent } from "./org-domain-event.js";

/**
 * Organization-scoped aggregate root: requires an `OrgDomainContext`, exposes `organizationId`,
 * and accepts only `OrgDomainEvent`s in `applyEvent`.
 */
export abstract class OrgAggregateRoot<T extends OrgAggregateState, TDomainEvent extends OrgDomainEvent<T>> extends AggregateRoot<T, TDomainEvent>
{
    public get organizationId(): string { return this.state.organizationId; }


    public constructor(domainContext: OrgDomainContext, events: ReadonlyArray<OrgDomainEvent<T>>,
        stateFactory: OrgAggregateStateFactory<T>, state?: T)
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                organizationId: "string"
            });

        super(domainContext, events, stateFactory, state);
    }


    protected override applyEvent(event: TDomainEvent): void
    {
        given(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(OrgDomainEvent);

        super.applyEvent(event);
    }
}
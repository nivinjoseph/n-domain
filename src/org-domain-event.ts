import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { serialize } from "@nivinjoseph/n-util";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { DomainEvent } from "./domain-event.js";
import { OrgDomainEventData } from "./org-domain-event-data.js";
import { OrgDomainContext } from "./org-domain-context.js";
import { OrgAggregateRoot } from "./org-aggregate-root.js";

export abstract class OrgDomainEvent<T extends OrgAggregateState> extends DomainEvent<T>
{
    private _organizationId: string | null;


    @serialize("$organizationId")
    public get organizationId(): string
    {
        given(this, "this")
            .ensure(t => t._organizationId != null, "accessing property before apply");

        return this._organizationId!;
    }


    public constructor(data: OrgDomainEventData)
    {
        super(data);

        const { $organizationId } = data;

        given($organizationId, "$organizationId").ensureIsString();
        this._organizationId = $organizationId ?? null;
    }


    public override apply(aggregate: OrgAggregateRoot<T>, domainContext: OrgDomainContext, state: T): void
    {
        given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensureIsInstanceOf(OrgAggregateRoot);
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({
            userId: "string",
            organizationId: "string"
        });
        given(state, "state").ensureHasValue().ensureIsObject();

        if (this._organizationId == null)
            this._organizationId = domainContext.organizationId;

        if (this._organizationId !== state.organizationId)
            throw new ApplicationException(`${this.name} organizationId '${this._organizationId}' does not match state organizationId '${state.organizationId}'`);

        super.apply(aggregate, domainContext, state);
    }
}
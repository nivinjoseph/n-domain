import { given } from "@nivinjoseph/n-defensive";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";

/**
 * Organization-scoped state factory. Unlike the stateless base factory, it takes the
 * `OrgDomainContext` in its constructor (to stamp `organizationId` into the default state) —
 * instantiate one per request/context; never share an instance across organizations.
 */
export abstract class OrgAggregateStateFactory<T extends OrgAggregateState> extends AggregateStateFactory<T>
{
    private readonly _orgDomainContext: OrgDomainContext;


    public constructor(orgDomainContext: OrgDomainContext)
    {
        super();

        given(orgDomainContext, "orgDomainContext").ensureHasValue().ensureIsObject();
        this._orgDomainContext = orgDomainContext;
    }


    public abstract override create(): T;

    protected override createDefaultAggregateState(): OrgAggregateState
    {
        return {
            ...super.createDefaultAggregateState(),
            organizationId: this._orgDomainContext.organizationId
        };
    }
}
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";
/**
 * Organization-scoped state factory. Unlike the stateless base factory, it takes the
 * `OrgDomainContext` in its constructor (to stamp `organizationId` into the default state) —
 * instantiate one per request/context; never share an instance across organizations.
 */
export declare abstract class OrgAggregateStateFactory<T extends OrgAggregateState> extends AggregateStateFactory<T> {
    private readonly _orgDomainContext;
    constructor(orgDomainContext: OrgDomainContext);
    abstract create(): T;
    protected createDefaultAggregateState(): OrgAggregateState;
}
//# sourceMappingURL=org-aggregate-state-factory.d.ts.map
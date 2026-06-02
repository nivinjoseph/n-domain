import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainContext } from "./org-domain-context.js";
export declare abstract class OrgAggregateStateFactory<T extends OrgAggregateState> extends AggregateStateFactory<T> {
    private readonly _orgDomainContext;
    constructor(orgDomainContext: OrgDomainContext);
    abstract create(): T;
    protected createDefaultAggregateState(): OrgAggregateState;
}
//# sourceMappingURL=org-aggregate-state-factory.d.ts.map
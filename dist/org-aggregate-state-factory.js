import { given } from "@nivinjoseph/n-defensive";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
/**
 * Organization-scoped state factory. Unlike the stateless base factory, it takes the
 * `OrgDomainContext` in its constructor (to stamp `organizationId` into the default state) —
 * instantiate one per request/context; never share an instance across organizations.
 */
export class OrgAggregateStateFactory extends AggregateStateFactory {
    _orgDomainContext;
    constructor(orgDomainContext) {
        super();
        given(orgDomainContext, "orgDomainContext").ensureHasValue().ensureIsObject();
        this._orgDomainContext = orgDomainContext;
    }
    createDefaultAggregateState() {
        return {
            ...super.createDefaultAggregateState(),
            organizationId: this._orgDomainContext.organizationId
        };
    }
}
//# sourceMappingURL=org-aggregate-state-factory.js.map
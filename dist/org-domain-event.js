import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { serialize } from "@nivinjoseph/n-util";
import { DomainEvent } from "./domain-event.js";
import { OrgAggregateRoot } from "./org-aggregate-root.js";
let OrgDomainEvent = (() => {
    let _classSuper = DomainEvent;
    let _instanceExtraInitializers = [];
    let _get_organizationId_decorators;
    return class OrgDomainEvent extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_organizationId_decorators = [serialize("$organizationId")];
            __esDecorate(this, null, _get_organizationId_decorators, { kind: "getter", name: "organizationId", static: false, private: false, access: { has: obj => "organizationId" in obj, get: obj => obj.organizationId }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        _organizationId = __runInitializers(this, _instanceExtraInitializers);
        get organizationId() {
            given(this, "this")
                .ensure(t => t._organizationId != null, "accessing property before apply");
            return this._organizationId;
        }
        constructor(data) {
            super(data);
            const { $organizationId } = data;
            given($organizationId, "$organizationId").ensureIsString();
            this._organizationId = $organizationId ?? null;
        }
        apply(aggregate, domainContext, state) {
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
    };
})();
export { OrgDomainEvent };
//# sourceMappingURL=org-domain-event.js.map
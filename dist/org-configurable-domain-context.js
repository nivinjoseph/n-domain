import { given } from "@nivinjoseph/n-defensive";
import { ConfigurableDomainContext } from "./configurable-domain-context.js";
export class OrgConfigurableDomainContext extends ConfigurableDomainContext {
    _organizationId = null;
    get organizationId() { return this._organizationId; }
    set organizationId(value) { this._organizationId = value; }
    constructor(userId, organizationId) {
        super(userId);
        given(organizationId, "organizationId").ensureHasValue().ensureIsString();
        this._organizationId = organizationId;
    }
}
//# sourceMappingURL=org-configurable-domain-context.js.map
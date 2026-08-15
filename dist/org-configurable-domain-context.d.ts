import { ConfigurableDomainContext } from "./configurable-domain-context.js";
import { OrgDomainContext } from "./org-domain-context.js";
/** `OrgDomainContext` implementation with mutable `userId` and `organizationId`. */
export declare class OrgConfigurableDomainContext extends ConfigurableDomainContext implements OrgDomainContext {
    private _organizationId;
    get organizationId(): string;
    set organizationId(value: string);
    constructor(userId: string, organizationId: string);
}
//# sourceMappingURL=org-configurable-domain-context.d.ts.map
import { given } from "@nivinjoseph/n-defensive";
import { ConfigurableDomainContext } from "./configurable-domain-context.js";
import { OrgDomainContext } from "./org-domain-context.js";

/** `OrgDomainContext` implementation with mutable `userId` and `organizationId`. */
export class OrgConfigurableDomainContext extends ConfigurableDomainContext implements OrgDomainContext
{
    private _organizationId: string = null as any;


    public get organizationId(): string { return this._organizationId; }
    public set organizationId(value: string) { this._organizationId = value; }


    public constructor(userId: string, organizationId: string)
    {
        super(userId);

        given(organizationId, "organizationId").ensureHasValue().ensureIsString();
        this._organizationId = organizationId;
    }
}
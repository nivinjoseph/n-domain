import { given } from "@nivinjoseph/n-defensive";
export class ConfigurableDomainContext {
    get userId() { return this._userId; }
    set userId(value) { this._userId = value; }
    constructor(userId) {
        given(userId, "userId").ensureHasValue().ensureIsString();
        this._userId = userId;
    }
}
//# sourceMappingURL=configurable-domain-context.js.map
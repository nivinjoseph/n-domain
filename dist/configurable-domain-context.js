"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurableDomainContext = void 0;
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class ConfigurableDomainContext {
    constructor(userId) {
        (0, n_defensive_1.given)(userId, "userId").ensureHasValue().ensureIsString();
        this._userId = userId;
    }
    get userId() { return this._userId; }
    set userId(value) { this._userId = value; }
}
exports.ConfigurableDomainContext = ConfigurableDomainContext;
//# sourceMappingURL=configurable-domain-context.js.map
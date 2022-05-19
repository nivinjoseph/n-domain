"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainHelper = void 0;
const n_util_1 = require("@nivinjoseph/n-util");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
// public
class DomainHelper {
    static get now() { return Date.now(); }
    static generateId(prefix) {
        (0, n_defensive_1.given)(prefix, "prefix").ensureHasValue().ensureIsString()
            .ensure(t => t.trim().length === 3, "should be 3 chars long")
            .ensure((t) => t.matchesFormat("@@@"), "should contain only alphabet chars");
        // 4 + 32 = 36
        return `${prefix.trim().toLowerCase()}_${n_util_1.Uuid.create().replaceAll("-", "")}`;
    }
}
exports.DomainHelper = DomainHelper;
//# sourceMappingURL=domain-helper.js.map
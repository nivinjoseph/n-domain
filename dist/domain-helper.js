"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nivinjoseph/n-ext");
const n_util_1 = require("@nivinjoseph/n-util");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
// public
class DomainHelper {
    static get now() { return Date.now(); }
    static generateId(prefix) {
        n_defensive_1.given(prefix, "prefix").ensureHasValue().ensureIsString()
            .ensure(t => t.trim().length >= 3 && t.trim().length <= 7, "should be between 3 and 7 chars long")
            .ensure(t => {
            const format = [];
            n_util_1.Make.loop(() => format.push("@"), t.trim().length);
            return t.trim().matchesFormat(format.join(""));
        }, "should contain only alphabet chars");
        return `${prefix.trim().toLowerCase()}_${n_util_1.Uuid.create().replaceAll("-", "")}`;
    }
}
exports.DomainHelper = DomainHelper;
//# sourceMappingURL=domain-helper.js.map
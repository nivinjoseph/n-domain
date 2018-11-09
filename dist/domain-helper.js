"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_sec_1 = require("@nivinjoseph/n-sec");
require("@nivinjoseph/n-ext");
class DomainHelper {
    static get now() { return Date.now(); }
    static generateId() {
        return n_sec_1.Uuid.create().trim().replaceAll(" ", "").replaceAll("-", "").toLowerCase();
    }
}
exports.DomainHelper = DomainHelper;
//# sourceMappingURL=domain-helper.js.map
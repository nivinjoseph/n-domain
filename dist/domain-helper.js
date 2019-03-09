"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nivinjoseph/n-ext");
const n_util_1 = require("@nivinjoseph/n-util");
class DomainHelper {
    static get now() { return Date.now(); }
    static generateId() {
        return n_util_1.Uuid.create().replaceAll("-", "");
    }
}
exports.DomainHelper = DomainHelper;
//# sourceMappingURL=domain-helper.js.map
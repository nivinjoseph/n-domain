"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nivinjoseph/n-ext");
const n_util_1 = require("@nivinjoseph/n-util");
class DomainHelper {
    static get now() { return Date.now(); }
    static generateId() {
        return n_util_1.Uuid.create().replaceAll("-", "");
    }
    static createDefaultAggregateState() {
        return {
            typeVersion: 1,
            id: null,
            version: null,
            createdAt: null,
            updatedAt: null,
        };
    }
}
exports.DomainHelper = DomainHelper;
//# sourceMappingURL=domain-helper.js.map
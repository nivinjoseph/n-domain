"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DevDomainContext {
    get userId() { return "dev"; }
}
exports.DevDomainContext = DevDomainContext;
class SystemDomainContext {
    get userId() { return "system"; }
}
exports.SystemDomainContext = SystemDomainContext;
//# sourceMappingURL=domain-context.js.map
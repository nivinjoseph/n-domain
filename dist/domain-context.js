"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DevDomainContext {
    get user() { return "dev"; }
}
exports.DevDomainContext = DevDomainContext;
class SystemDomainContext {
    get user() { return "system"; }
}
exports.SystemDomainContext = SystemDomainContext;
//# sourceMappingURL=domain-context.js.map
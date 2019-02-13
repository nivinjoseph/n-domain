"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nivinjoseph/n-ext");
class DomainObject {
    equals(value) {
        if (value == null)
            return false;
        if (value === this)
            return true;
        if (value.getTypeName() !== this.getTypeName())
            return false;
        return JSON.stringify(this.serialize()) === JSON.stringify(value.serialize());
    }
}
exports.DomainObject = DomainObject;
//# sourceMappingURL=domain-object.js.map
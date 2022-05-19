"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainObject = void 0;
const n_util_1 = require("@nivinjoseph/n-util");
// public
class DomainObject extends n_util_1.Serializable {
    /**
     * @param value (the value to compare)
     */
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
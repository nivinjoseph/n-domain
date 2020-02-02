"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nivinjoseph/n-ext");
// public
class DomainObject {
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
        // for (const key in this)
        // {
        //     if (this[key] !== (<any>value)[key])
        //         return false;
        // }
        // return true;
    }
}
exports.DomainObject = DomainObject;
//# sourceMappingURL=domain-object.js.map
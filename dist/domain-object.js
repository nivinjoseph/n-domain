import { Serializable } from "@nivinjoseph/n-util";
// public
export class DomainObject extends Serializable {
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
//# sourceMappingURL=domain-object.js.map
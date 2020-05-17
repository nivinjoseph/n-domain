import "@nivinjoseph/n-ext";
import { Serializable } from "@nivinjoseph/n-util";
export declare abstract class DomainObject extends Serializable {
    /**
     * @param value (the value to compare)
     */
    equals(value: DomainObject): boolean;
}

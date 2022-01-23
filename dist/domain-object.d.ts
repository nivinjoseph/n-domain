import { Serializable } from "@nivinjoseph/n-util";
export declare abstract class DomainObject<TData extends object = {}> extends Serializable<TData> {
    /**
     * @param value (the value to compare)
     */
    equals(value: DomainObject | null): boolean;
}

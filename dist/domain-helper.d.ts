import "@nivinjoseph/n-ext";
import { AggregateState } from "./aggregate-state";
export declare class DomainHelper {
    static readonly now: number;
    static generateId(): string;
    static createDefaultAggregateState(): AggregateState;
}

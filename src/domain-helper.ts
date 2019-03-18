
import "@nivinjoseph/n-ext";
import { Uuid } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state";

// public
export class DomainHelper
{
    public static get now(): number { return Date.now(); }


    public static generateId(): string
    {
        return Uuid.create().replaceAll("-", "");
    }
    
    public static createDefaultAggregateState(): AggregateState
    {
        return {
            typeVersion: 1,
            id: null as any,
            version: null as any,
            createdAt: null as any,
            updatedAt: null as any,
        };
    }
}
import { AggregateState } from "./aggregate-state";
import { SerializedDomainEvent } from "./serialized-domain-event";

// public
export interface SerializedAggregateRoot<T extends AggregateState>
{
    $id: string;
    $version: number;
    $createdAt: number;
    $updatedAt: number;
    $state: T;
    $events: ReadonlyArray<SerializedDomainEvent>;
}
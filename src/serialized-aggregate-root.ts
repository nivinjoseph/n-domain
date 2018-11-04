import { SerializedDomainEvent } from "./serialized-domain-event";

// public
export interface SerializedAggregateRoot
{
    $id: string;
    $version: number;
    $createdAt: number;
    $updatedAt: number;
    $events: ReadonlyArray<SerializedDomainEvent>;
}
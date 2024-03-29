import { DomainEventData } from "./domain-event-data.js";

// public
export interface AggregateRootData
{
    $id: string;
    $version: number;
    $createdAt: number;
    $updatedAt: number;
    $events: ReadonlyArray<DomainEventData>;
}
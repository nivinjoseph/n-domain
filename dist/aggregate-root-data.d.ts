import { DomainEventData } from "./domain-event-data";
export interface AggregateRootData {
    $id: string;
    $version: number;
    $createdAt: number;
    $updatedAt: number;
    $events: ReadonlyArray<DomainEventData>;
}

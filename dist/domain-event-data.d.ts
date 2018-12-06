export interface DomainEventData {
    $aggregateId?: string;
    $id?: string;
    $user?: string;
    $name?: string;
    $occurredAt?: number;
    $version?: number;
    $isCreatedEvent?: boolean;
}

// public
export interface DomainEventData
{
    $aggregateId?: string;
    $id?: string;
    $userId?: string;
    $name?: string;
    $occurredAt?: number;
    $version?: number;
    $isCreatedEvent?: boolean;
}
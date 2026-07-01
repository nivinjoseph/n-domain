// public
export interface DomainEventData
{
    $aggregateId?: string | null;
    $id?: string | null;
    $userId?: string | null;
    $name?: string | null;
    $occurredAt?: number | null;
    $version?: number | null;
    $isCreatedEvent?: boolean | null;
    // serialized default state (base fields stripped) frozen into the created event at creation time;
    // present only on created events. used on replay to source untouched fields from the stream rather
    // than from the current create() output. see DomainEvent.freezeDefaultState / apply.
    $frozenDefaultState?: object | null;
}
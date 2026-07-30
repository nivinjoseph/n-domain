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
    // the aggregate's state-schema version at the time the event was written. stamped on all new
    // events (legacy stored events lack it and are never retro-stamped). currently metadata-only:
    // event payload evolution remains tolerant-reader, but the stamp preserves the option of
    // versioned event upcasting later — stamps cannot be retrofitted.
    $schemaVersion?: number | null;
    // serialized default state (base fields stripped, stamped with an embedded $schemaVersion)
    // frozen into the created event at creation time; present only on created events. used on
    // replay to source untouched fields from the stream rather than from the current create()
    // output. upcast + overlaid by the AggregateRoot replay seam.
    $frozenDefaultState?: object | null;
}
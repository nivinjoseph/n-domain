import { AggregateState } from "./aggregate-state.js";

/** Aggregate state scoped to an organization. */
export interface OrgAggregateState extends AggregateState
{
    organizationId: string;
}
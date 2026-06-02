import { AggregateState } from "./aggregate-state.js";

export interface OrgAggregateState extends AggregateState
{
    organizationId: string;
}
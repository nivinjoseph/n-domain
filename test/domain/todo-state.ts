import { AggregateState } from "../../src";


export interface TodoState extends AggregateState
{
    title: string;
    description: string | null;
    isCompleted: boolean;
}
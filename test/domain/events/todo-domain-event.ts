import { DomainEvent } from "../../../src";
import { Todo } from "../todo";
import { TodoState } from "../todo-state";


export abstract class TodoDomainEvent extends DomainEvent<TodoState>
{
    public get refType(): string { return (<Object>Todo).getTypeName(); }
}
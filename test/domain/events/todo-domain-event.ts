import { DomainEvent } from "../../../src/index.js";
import { Todo } from "../todo.js";
import { TodoState } from "../todo-state.js";


export abstract class TodoDomainEvent extends DomainEvent<TodoState>
{
    public get refType(): string { return Todo.getTypeName(); }
}
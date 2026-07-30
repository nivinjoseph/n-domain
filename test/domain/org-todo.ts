import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import {
    AggregateFactory, DomainHelper, OrgAggregateRoot, OrgAggregateState, OrgAggregateStateFactory,
    OrgDomainContext, OrgDomainEvent, OrgDomainEventData, OrgRebaseEvent
} from "../../src/index.js";


// compact org-scoped fixture domain (state + factory + events + aggregate in one file);
// exists to pin the Org* halves of the framework, which the Todo domain cannot reach.

export interface OrgTodoState extends OrgAggregateState
{
    title: string;
}


export class OrgTodoStateFactory extends OrgAggregateStateFactory<OrgTodoState>
{
    public override create(): OrgTodoState
    {
        return {
            ...this.createDefaultAggregateState(),
            title: null as any
        };
    }
}


export abstract class OrgTodoDomainEvent extends OrgDomainEvent<OrgTodoState>
{
    public get refType(): string { return "OrgTodo"; }
}


@serialize("Test")
export class OrgTodoCreated extends OrgTodoDomainEvent
{
    private readonly _todoId: string;
    private readonly _title: string;


    @serialize
    public get todoId(): string { return this._todoId; }

    @serialize
    public get title(): string { return this._title; }


    public constructor(data: OrgDomainEventData & Pick<OrgTodoCreated, "todoId" | "title">)
    {
        given(data, "data").ensureHasValue().ensureIsObject();
        data.$isCreatedEvent = true;
        super(data);

        const { todoId, title } = data;

        given(todoId, "todoId").ensureHasValue().ensureIsString();
        this._todoId = todoId;

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;
    }


    protected applyEvent(state: OrgTodoState): void
    {
        state.id = this._todoId;
        state.title = this._title;
    }
}


@serialize("Test")
export class OrgTodoTitleUpdated extends OrgTodoDomainEvent
{
    private readonly _title: string;


    @serialize
    public get title(): string { return this._title; }


    public constructor(data: OrgDomainEventData & Pick<OrgTodoTitleUpdated, "title">)
    {
        super(data);

        const { title } = data;

        given(title, "title").ensureHasValue().ensureIsString();
        this._title = title;
    }


    protected applyEvent(state: OrgTodoState): void
    {
        state.title = this._title;
    }
}


@serialize("Test")
export class OrgTodoRebased extends OrgRebaseEvent<OrgTodoState>
{
    public get refType(): string { return "OrgTodo"; }
}


@serialize("Test")
export class OrgTodo extends OrgAggregateRoot<OrgTodoState, OrgTodoDomainEvent>
{
    public get title(): string { return this.state.title; }


    public static create(domainContext: OrgDomainContext, title: string): OrgTodo
    {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        given(title, "title").ensureHasValue().ensureIsString();

        const createdEvent = new OrgTodoCreated({
            todoId: DomainHelper.generateId("otd"),
            title
        });

        return new AggregateFactory(OrgTodo, domainContext, new OrgTodoStateFactory(domainContext))
            .createFromEvents([createdEvent]);
    }


    public updateTitle(title: string): void
    {
        given(title, "title").ensureHasValue().ensureIsString();

        this.applyEvent(new OrgTodoTitleUpdated({ title: title.trim() }));
    }

    public override rebase(version: number): void
    {
        super.rebase(version,
            (baseline: object, rebaseVersion: number) =>
            {
                return new OrgTodoRebased({
                    $baseline: baseline,
                    $rebaseVersion: rebaseVersion
                });
            });
    }
}

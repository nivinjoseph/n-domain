import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "../../../src/index.js";


@serialize
export class TodoDescription extends DomainObject
{
    private readonly _description: string;
    private readonly _descriptionSummary: string;


    @serialize
    public get description(): string { return this._description; }

    @serialize
    public get descriptionSummary(): string { return this._descriptionSummary; }


    public constructor(data: Pick<TodoDescription, "description" | "descriptionSummary">)
    {
        super(data);

        const { description, descriptionSummary } = data;

        given(description, "description").ensureHasValue().ensureIsString();
        this._description = description;

        given(descriptionSummary, "descriptionSummary").ensureHasValue().ensureIsString();
        this._descriptionSummary = descriptionSummary;
    }

    public static create(value: string): TodoDescription
    {
        given(value, "value").ensureHasValue().ensureIsString();

        return new TodoDescription({
            description: value,
            descriptionSummary: value.split(" ").take(2).join(" ")
        });
    }
}
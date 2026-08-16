import assert from "node:assert";
import { describe, test } from "node:test";
import { Deserializer, serialize } from "@nivinjoseph/n-util";
import { DomainObject, DomainObjectData } from "../src/index.js";


@serialize("Test")
class GeoCoordinate extends DomainObject<GeoCoordinate, "lat" | "lng">
{
    private readonly _lat: number;
    private readonly _lng: number;


    @serialize
    public get lat(): number { return this._lat; }

    @serialize
    public get lng(): number { return this._lng; }


    public constructor(data: DomainObjectData<GeoCoordinate>)
    {
        super(data);
        this._lat = data.lat;
        this._lng = data.lng;
    }
}


@serialize("Test")
class Address extends DomainObject<Address, "street" | "coordinate">
{
    private readonly _street: string;
    private readonly _coordinate: GeoCoordinate;


    @serialize
    public get street(): string { return this._street; }

    @serialize
    public get coordinate(): GeoCoordinate { return this._coordinate; }


    public constructor(data: DomainObjectData<Address>)
    {
        super(data);
        this._street = data.street;
        this._coordinate = data.coordinate; // instance-typed input — no cast required
    }
}


@serialize("Test")
class Workplace extends DomainObject<Workplace, "name" | "address">
{
    private readonly _name: string;
    private readonly _address: Address;


    @serialize
    public get name(): string { return this._name; }

    @serialize
    public get address(): Address { return this._address; }


    public constructor(data: DomainObjectData<Workplace>)
    {
        super(data);
        this._name = data.name;
        this._address = data.address;
    }
}


await describe("Nested DomainObject tests", async () =>
{
    const createWorkplace = (): Workplace => new Workplace({
        name: "NS Labs",
        address: new Address({
            street: "123 Main St",
            coordinate: new GeoCoordinate({ lat: 43.65, lng: -79.38 })
        })
    });

    await test("three-level nesting round-trips through serialize/deserialize", () =>
    {
        const original = createWorkplace();

        const json = JSON.stringify(original.serialize());
        const rehydrated = Deserializer.deserialize<Workplace>(JSON.parse(json));

        assert.ok(rehydrated instanceof Workplace);
        assert.ok(rehydrated.address instanceof Address);
        assert.ok(rehydrated.address.coordinate instanceof GeoCoordinate);
        assert.strictEqual(rehydrated.address.coordinate.lat, 43.65);
        assert.ok(original.equals(rehydrated));
        assert.ok(original.address.coordinate.equals(rehydrated.address.coordinate));
    });

    await test("serialize() output is typed as plain serialized data at every level", () =>
    {
        const serialized = createWorkplace().serialize();

        // deep data keys and $typename resolve on the serialized type
        const street: string = serialized.address.street;
        const lat: number = serialized.address.coordinate.lat;
        const typename: string = serialized.address.coordinate.$typename;
        assert.strictEqual(street, "123 Main St");
        assert.strictEqual(lat, 43.65);
        assert.strictEqual(typename, "Test.GeoCoordinate");

        // and the runtime values really are plain data, exactly as the type claims
        assert.ok(!(serialized.address instanceof Address));

        // @ts-expect-error instance methods do not exist on serialized output
        assert.strictEqual(serialized.address.equals, undefined);

        // @ts-expect-error serialized output is not assignable where a live instance is expected
        const asInstance: Address = serialized.address;
        assert.ok(asInstance);
    });

    await test("constructor data requires live instances, not serialized data", () =>
    {
        const workplace = createWorkplace();

        // compile-time assertion only (never invoked): the constructor's data type
        // rejects serialized output where live instances are expected
        // @ts-expect-error serialized (plain) data is rejected where instances are expected
        const typeCheckOnly = (): Workplace => new Workplace(workplace.serialize());
        assert.strictEqual(typeof typeCheckOnly, "function");
    });

    await test("deprecated keys inside nested levels are tolerated on hydration", () =>
    {
        const stored = {
            $typename: "Test.Workplace",
            name: "NS Labs",
            address: {
                $typename: "Test.Address",
                street: "123 Main St",
                deprecatedField: "removed from code long ago",
                coordinate: { $typename: "Test.GeoCoordinate", lat: 1, lng: 2, alsoDeprecated: true }
            }
        };

        const rehydrated = Deserializer.deserialize<Workplace>(stored);
        assert.ok(rehydrated.address.coordinate instanceof GeoCoordinate);
        assert.strictEqual(rehydrated.address.street, "123 Main St");
    });
});

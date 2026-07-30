import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { AggregateState, BASE_STATE_KEYS } from "./aggregate-state.js";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
import { StateMigration } from "./state-migration.js";


export type StateArtifactKind = "snapshot" | "frozen-default" | "rebase-baseline";


export abstract class AggregateStateFactory<T extends AggregateState>
{
    /**
     * Current state-schema version, derived from the migration chain: `defineMigrations().length + 1`.
     * A version bump without a migration step (or a step without a bump) is unrepresentable.
     * The version is stamped as `$schemaVersion` metadata on stored artifacts — it never exists on live state.
     */
    public get schemaVersion(): number
    {
        return this._fetchMigrations().length + 1;
    }

    /**
     * Schema version assumed for stored artifacts that carry NO version stamp (frozen defaults and
     * rebase baselines written before schema versioning existed). Default 1. Override ONLY if your
     * pre-4.0 estate shipped `typeVersion > 1`: unstamped overlay artifacts written at that time
     * were shaped by that version, and declaring it here keeps them aligned with the migration
     * chain (legacy snapshots need no declaration — their in-band `typeVersion` is self-describing).
     */
    public get preVersioningSchemaVersion(): number
    {
        return 1;
    }


    public abstract create(): T;

    /**
     * @internal framework driver — upcasts a stored state document (serialized domain keys only)
     * from `declaredVersion` to the current schema version, then enforces shape conformance:
     * keys that do not exist on the current `create()` output cause a throw (zombie/rename guard);
     * missing keys are fine — they fall through to the current `create()` defaults (additive evolution).
     */
    public upcastStateDocument(payload: Record<string, any>, declaredVersion: number, kind: StateArtifactKind): Record<string, any>
    {
        given(payload, "payload").ensureHasValue().ensureIsObject();
        given(kind, "kind").ensureHasValue().ensureIsString();
        given(declaredVersion, "declaredVersion").ensureHasValue().ensureIsNumber()
            .ensure(t => Number.isInteger(t) && t >= 1, "must be an integer >= 1");

        const migrations = this._fetchMigrations();
        const currentVersion = migrations.length + 1;
        if (declaredVersion > currentVersion)
            throw new ApplicationException(
                `${kind} artifact for '${(<Object>this).getTypeName()}' declares schema version ${declaredVersion} `
                + `but the current schema version is ${currentVersion}; the artifact was written by newer code`);

        // deep clone: severs every alias between the caller's artifact (often a stored event's
        // retained payload that will be re-serialized) and both the migration chain's working
        // document and the live state the result is merged into. payloads are snapshot-serialized
        // plain JSON by contract, so a structural clone is semantics-preserving.
        let migrated: Record<string, any> = structuredClone(payload);
        for (let version = declaredVersion; version < currentVersion; version++)
        {
            migrated = migrations[version - 1].migrate(migrated);
            given(migrated as object, "migrated").ensureHasValue().ensureIsObject();
        }

        const domainKeys = this._fetchDomainKeys();
        const extraKeys = Object.keys(migrated).where(t => !domainKeys.contains(t));
        if (extraKeys.length > 0)
            throw new ApplicationException(
                `${kind} artifact for '${(<Object>this).getTypeName()}' has keys [${extraKeys.join(", ")}] `
                + `that do not exist on the current state shape after upcasting from schema version ${declaredVersion} `
                + `to ${currentVersion}; add a migration step in defineMigrations() that transforms them`);

        return migrated;
    }

    /**
     * @internal framework driver — full snapshot ingress. Reads the version stamp
     * (`$schemaVersion`, falling back to the legacy in-band `typeVersion`, falling back to
     * `preVersioningSchemaVersion`), splits base fields from the domain payload, upcasts,
     * and reassembles deserialized state.
     */
    public ingestSnapshot(raw: object): T
    {
        given(raw, "raw").ensureHasValue().ensureIsObject();

        const snapshot = Object.assign({}, raw) as Record<string, any>;

        const legacyTypeVersion = snapshot["$schemaVersion"] == null ? snapshot["typeVersion"] as number | undefined : undefined;
        const declaredVersion = (snapshot["$schemaVersion"] ?? legacyTypeVersion ?? this.preVersioningSchemaVersion) as number;
        delete snapshot["$schemaVersion"];
        delete snapshot["typeVersion"];

        // a legacy in-band typeVersion beyond the chain means the 3.x update() history was not
        // (fully) ported into defineMigrations() — say that, instead of the misleading
        // "written by newer code" the generic guard would produce.
        if (legacyTypeVersion != null && legacyTypeVersion > this.schemaVersion)
            throw new ApplicationException(
                `snapshot for '${(<Object>this).getTypeName()}' carries legacy in-band typeVersion ${legacyTypeVersion} `
                + `but only ${this.schemaVersion - 1} migration step(s) are defined (schema version ${this.schemaVersion}); `
                + `port the pre-4.0 update() chain into defineMigrations() so the chain covers versions up to ${legacyTypeVersion}`);

        const baseFields: Record<string, any> = {};
        BASE_STATE_KEYS.forEach(key =>
        {
            if (key in snapshot)
            {
                baseFields[key] = snapshot[key];
                delete snapshot[key];
            }
        });

        const payload = this.upcastStateDocument(snapshot, declaredVersion, "snapshot");
        const state = AggregateStateHelper.deserializeSnapshotIntoState(payload);

        return Object.assign(state, baseFields) as T;
    }

    /**
     * Append-only, ordered migration chain. Entry `[i]` migrates a stored state document from
     * schema version `i + 1` to `i + 2`. Only renames/removals/retypes of existing keys need a
     * step — purely additive changes are free (missing keys fall through to `create()` defaults).
     */
    protected defineMigrations(): ReadonlyArray<StateMigration>
    {
        return [];
    }

    protected createDefaultAggregateState(): AggregateState
    {
        return {
            id: null as any,
            version: null as any,
            createdAt: null as any,
            updatedAt: null as any,
            isRebased: false,
            rebasedFromVersion: 0
        };
    }

    private _fetchDomainKeys(): ReadonlyArray<string>
    {
        return Object.keys(this.create()).where(t => !BASE_STATE_KEYS.contains(t));
    }

    // single validated accessor so schemaVersion and the chain fold can never desync,
    // and a malformed user-defined chain fails with a real message instead of a raw TypeError
    private _fetchMigrations(): ReadonlyArray<StateMigration>
    {
        const migrations = this.defineMigrations();
        given(migrations as Array<StateMigration>, "migrations").ensureHasValue().ensureIsArray()
            .ensure(t => t.every(step => (step as StateMigration | null) != null && typeof step.migrate === "function"),
                "every defineMigrations() entry must be an object with a migrate function");
        return migrations;
    }
}

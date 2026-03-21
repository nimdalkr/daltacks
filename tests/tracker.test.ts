import { initSimnet, type Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

let simnet: Simnet;
let wallet1: string;
let wallet2: string;

describe("tracker", () => {
  beforeEach(async () => {
    simnet = await initSimnet("./tests/fixtures/Clarinet.test.toml", true);
    const accounts = simnet.getAccounts();
    wallet1 = accounts.get("wallet_1")!;
    wallet2 = accounts.get("wallet_2")!;
  });

  it("creates one active mission per wallet", () => {
    const create = simnet.callPublicFn(
      "tracker",
      "create-mission",
      [Cl.stringAscii("builder-run"), Cl.bufferFromHex("11".repeat(32)), Cl.uint(500)],
      wallet1
    );

    expect(Cl.prettyPrint(create.result)).toBe("(ok u1)");
    expect(Cl.prettyPrint(simnet.getDataVar("tracker", "snapshot-counter"))).toBe("u1");
    expect(Cl.prettyPrint(simnet.getMapEntry("tracker", "active-snapshot-by-owner", Cl.principal(wallet1)))).toBe(
      "(some u1)"
    );

    const missionRepr = Cl.prettyPrint(
      simnet.getMapEntry("tracker", "snapshots", Cl.tuple({ id: Cl.uint(1) }))
    );
    expect(missionRepr).toContain(`owner: '${wallet1}`);
    expect(missionRepr).toContain("mission-label: \"builder-run\"");
    expect(missionRepr).toContain("check-in-count: u0");
    expect(missionRepr).toContain("status: \"active\"");
  });

  it("keeps the legacy create-snapshot path working", () => {
    const create = simnet.callPublicFn(
      "tracker",
      "create-snapshot",
      [Cl.bufferFromHex("22".repeat(32)), Cl.uint(600)],
      wallet1
    );

    expect(Cl.prettyPrint(create.result)).toBe("(ok u1)");

    const missionRepr = Cl.prettyPrint(
      simnet.getMapEntry("tracker", "snapshots", Cl.tuple({ id: Cl.uint(1) }))
    );
    expect(missionRepr).toContain("mission-label: \"legacy-mission\"");
  });

  it("updates builder stats on check-in", () => {
    simnet.callPublicFn(
      "tracker",
      "create-mission",
      [Cl.stringAscii("proof-loop"), Cl.bufferFromHex("33".repeat(32)), Cl.uint(700)],
      wallet1
    );

    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("aa".repeat(32))], wallet1);
    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("bb".repeat(32))], wallet1);

    const statsRepr = Cl.prettyPrint(simnet.callReadOnlyFn("tracker", "get-builder-stats", [Cl.principal(wallet1)], wallet1).result);
    expect(statsRepr).toContain("total-missions-created: u1");
    expect(statsRepr).toContain("total-check-ins: u2");
  });

  it("completes a mission after three check-ins", () => {
    simnet.callPublicFn(
      "tracker",
      "create-mission",
      [Cl.stringAscii("mainnet-streak"), Cl.bufferFromHex("44".repeat(32)), Cl.uint(900)],
      wallet1
    );

    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("aa".repeat(32))], wallet1);
    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("bb".repeat(32))], wallet1);
    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("cc".repeat(32))], wallet1);

    const complete = simnet.callPublicFn("tracker", "complete-mission", [], wallet1);
    expect(Cl.prettyPrint(complete.result)).toBe("(ok true)");

    const missionRepr = Cl.prettyPrint(
      simnet.getMapEntry("tracker", "snapshots", Cl.tuple({ id: Cl.uint(1) }))
    );
    expect(missionRepr).toContain("status: \"completed\"");

    const statsRepr = Cl.prettyPrint(simnet.callReadOnlyFn("tracker", "get-builder-stats", [Cl.principal(wallet1)], wallet1).result);
    expect(statsRepr).toContain("missions-completed: u1");
  });

  it("publishes a profile and claims badges once thresholds are reached", () => {
    simnet.callPublicFn(
      "tracker",
      "create-mission",
      [Cl.stringAscii("public-builder"), Cl.bufferFromHex("55".repeat(32)), Cl.uint(900)],
      wallet1
    );

    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("aa".repeat(32))], wallet1);
    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("bb".repeat(32))], wallet1);
    simnet.callPublicFn("tracker", "check-in", [Cl.bufferFromHex("cc".repeat(32))], wallet1);
    simnet.callPublicFn("tracker", "complete-mission", [], wallet1);
    simnet.callPublicFn("tracker", "publish-profile", [Cl.stringAscii("nimdal"), Cl.stringAscii("mainnet builder")], wallet1);

    const streakBadge = simnet.callPublicFn("tracker", "claim-badge", [Cl.uint(1)], wallet1);
    const finisherBadge = simnet.callPublicFn("tracker", "claim-badge", [Cl.uint(2)], wallet1);

    expect(Cl.prettyPrint(streakBadge.result)).toBe("(ok true)");
    expect(Cl.prettyPrint(finisherBadge.result)).toBe("(ok true)");

    const profileRepr = Cl.prettyPrint(simnet.callReadOnlyFn("tracker", "get-profile", [Cl.principal(wallet1)], wallet1).result);
    expect(profileRepr).toContain("display-name: \"nimdal\"");
    expect(Cl.prettyPrint(simnet.callReadOnlyFn("tracker", "has-badge", [Cl.principal(wallet1), Cl.uint(1)], wallet1).result)).toBe("true");
  });

  it("rejects a second active mission and empty badge claims", () => {
    simnet.callPublicFn(
      "tracker",
      "create-mission",
      [Cl.stringAscii("once-only"), Cl.bufferFromHex("66".repeat(32)), Cl.uint(900)],
      wallet2
    );

    const duplicate = simnet.callPublicFn(
      "tracker",
      "create-mission",
      [Cl.stringAscii("again"), Cl.bufferFromHex("77".repeat(32)), Cl.uint(910)],
      wallet2
    );
    const badge = simnet.callPublicFn("tracker", "claim-badge", [Cl.uint(1)], wallet2);

    expect(Cl.prettyPrint(duplicate.result)).toBe("(err u100)");
    expect(Cl.prettyPrint(badge.result)).toBe("(err u103)");
  });
});

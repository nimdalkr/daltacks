import { initSimnet, type Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

let simnet: Simnet;
let wallet1: string;
let wallet2: string;

describe("tracker", () => {
  beforeEach(async () => {
    simnet = await initSimnet("./Clarinet.toml", true);
    const accounts = simnet.getAccounts();
    wallet1 = accounts.get("wallet_1")!;
    wallet2 = accounts.get("wallet_2")!;
  });

  it("creates one active snapshot per wallet", () => {
    const create = simnet.callPublicFn(
      "tracker",
      "create-snapshot",
      [Cl.bufferFromHex("11".repeat(32)), Cl.uint(500)],
      wallet1
    );

    expect(Cl.prettyPrint(create.result)).toBe("(ok u1)");
    expect(Cl.prettyPrint(simnet.getDataVar("tracker", "snapshot-counter"))).toBe("u1");
    expect(Cl.prettyPrint(simnet.getMapEntry("tracker", "active-snapshot-by-owner", Cl.principal(wallet1)))).toBe(
      "(some u1)"
    );

    const snapshotRepr = Cl.prettyPrint(
      simnet.getMapEntry("tracker", "snapshots", Cl.tuple({ id: Cl.uint(1) }))
    );
    expect(snapshotRepr).toContain(`owner: '${wallet1}`);
    expect(snapshotRepr).toContain("check-in-count: u0");
    expect(snapshotRepr).toContain("due-at-height: u500");
  });

  it("rejects creating a second active snapshot for the same wallet", () => {
    simnet.callPublicFn(
      "tracker",
      "create-snapshot",
      [Cl.bufferFromHex("22".repeat(32)), Cl.uint(700)],
      wallet1
    );

    const duplicate = simnet.callPublicFn(
      "tracker",
      "create-snapshot",
      [Cl.bufferFromHex("33".repeat(32)), Cl.uint(800)],
      wallet1
    );

    expect(Cl.prettyPrint(duplicate.result)).toBe("(err u100)");
  });

  it("updates the active snapshot on check-in", () => {
    simnet.callPublicFn(
      "tracker",
      "create-snapshot",
      [Cl.bufferFromHex("44".repeat(32)), Cl.uint(900)],
      wallet1
    );
    simnet.mineEmptyBlocks(3);

    const checkIn = simnet.callPublicFn(
      "tracker",
      "check-in",
      [Cl.bufferFromHex("aa".repeat(32))],
      wallet1
    );

    expect(Cl.prettyPrint(checkIn.result)).toBe("(ok true)");

    const snapshotRepr = Cl.prettyPrint(
      simnet.getMapEntry("tracker", "snapshots", Cl.tuple({ id: Cl.uint(1) }))
    );
    expect(snapshotRepr).toContain("check-in-count: u1");
    expect(snapshotRepr).toContain(`0x${"aa".repeat(32)}`);
    expect(snapshotRepr).toContain("last-check-in-height: (some");
  });

  it("rejects check-in when no active snapshot exists", () => {
    const checkIn = simnet.callPublicFn(
      "tracker",
      "check-in",
      [Cl.bufferFromHex("bb".repeat(32))],
      wallet2
    );

    expect(Cl.prettyPrint(checkIn.result)).toBe("(err u101)");
  });
});

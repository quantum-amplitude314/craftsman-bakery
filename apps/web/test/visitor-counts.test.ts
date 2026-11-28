import { describe, expect, test } from "bun:test";
import { visitorCountsViewOf } from "../src/lib/visitor-counts.ts";

const counts = {
  since: "2026-11-27T09:00:00.000Z",
  until: "2026-11-28T09:00:00.000Z",
  people: 1,
  agents: 2,
  bots: 31,
};

describe("visitorCountsViewOf", () => {
  test("each kind with its label, and the time of the count on the bakery's clock", () => {
    const view = visitorCountsViewOf({ counts, timeZone: "Europe/Prague" });

    expect(view).toEqual({
      kinds: [
        { count: 1, label: "person" },
        { count: 2, label: "agents" },
        { count: 31, label: "bots" },
      ],
      updatedAt: "10:00",
    });
  });

  test("none is plural", () => {
    const { kinds } = visitorCountsViewOf({
      counts: { ...counts, people: 0, agents: 1, bots: 1 },
      timeZone: "Europe/Prague",
    });

    expect(kinds.map(({ label }) => label)).toEqual(["people", "agent", "bot"]);
  });
});

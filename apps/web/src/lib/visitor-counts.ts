import { clockOf, type VisitorCounts } from "@craftsman-bakery/contracts";

const kindOf = ({ count, one, many }: { count: number; one: string; many: string }) => ({
  count,
  label: count === 1 ? one : many,
});

export const visitorCountsViewOf = ({
  counts: { people, agents, bots, until },
  timeZone,
}: {
  counts: VisitorCounts;
  timeZone: string;
}) => {
  const { time: updatedAt } = clockOf({ instant: new Date(until), timeZone });
  const view = {
    kinds: [
      kindOf({ count: people, one: "person", many: "people" }),
      kindOf({ count: agents, one: "agent", many: "agents" }),
      kindOf({ count: bots, one: "bot", many: "bots" }),
    ],
    updatedAt,
  };

  return view;
};

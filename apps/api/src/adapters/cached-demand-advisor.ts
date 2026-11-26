import type { DayForAdvice, DemandAdvisor, ProductDemand } from "../queries/demand-advisor.ts";

const ANSWER_TTL_MS = 10 * 60 * 1000;
const MAX_KEPT_ANSWERS = 50;

export type AdviceCache = Map<string, { answeredAt: number; demands: ProductDemand[] }>;

const clocklessKeyOf = ({ bakeryClockNow: _, ...day }: DayForAdvice) => JSON.stringify(day);

const forgetOldest = (cache: AdviceCache) => {
  const [oldest] = cache.keys();
  if (oldest !== undefined) cache.delete(oldest);
};

export const createCachedDemandAdvisor = ({
  advisor,
  cache,
  now = Date.now,
}: {
  advisor: DemandAdvisor;
  cache: AdviceCache;
  now?: () => number;
}) => {
  const cached: DemandAdvisor = {
    adviseOn: async (day) => {
      const key = clocklessKeyOf(day);
      const kept = cache.get(key);
      if (kept && now() - kept.answeredAt < ANSWER_TTL_MS) return kept.demands;

      const demands = await advisor.adviseOn(day);
      cache.delete(key);
      cache.set(key, { answeredAt: now(), demands });
      if (cache.size > MAX_KEPT_ANSWERS) forgetOldest(cache);

      return demands;
    },
  };

  return cached;
};

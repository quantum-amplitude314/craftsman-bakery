import { type DEMAND_OUTLOOKS, demandProbabilitiesSchema } from "@craftsman-bakery/contracts";
import { z } from "zod";
import type { DayForAdvice, DemandAdvisor } from "../queries/demand-advisor.ts";

const CLEF_MODEL_ID = "@cf/cloudflare/clef";
const CLEF_MODEL = "clef";
const TIMEOUT_MS = 8000;

const BAKERY =
  "A small artisan bakery in Prague, Czech Republic. Customers reserve bread and pastry for pickup; the rest is sold over the counter.";

const DEMAND_CRITERIA: Record<(typeof DEMAND_OUTLOOKS)[number], string> = {
  much_less: "About 30 % less than usual",
  less: "About 15 % less than usual",
  usual: "About as usual",
  more: "About 15 % more than usual",
  much_more: "About 30 % more than usual",
};

const responseSchema = z.object({
  answers: z.record(z.string(), z.object({ probabilities: demandProbabilitiesSchema })),
});

const questionIdOf = (productId: string) => `demand.${productId}`;

/** The day as Clef reads it: names, not ids. */
const stateOf = ({ products, ...day }: DayForAdvice) => ({
  bakery: BAKERY,
  ...day,
  products: products.map(({ name, defaultCapacity, reserved, recentBakes }) => ({
    name,
    usualReservableAmount: defaultCapacity,
    reservedSoFar: reserved,
    recentBakesOnThisWeekday: recentBakes,
  })),
});

const questionsOf = ({ weekday, products }: DayForAdvice) =>
  Object.fromEntries(
    products.map(({ productId, name }) => [
      questionIdOf(productId),
      {
        type: "choice",
        instructions: `How much ${name} will customers reserve for the pickup day, compared with a usual ${weekday}? Weigh the recent bakes on this weekday; what is reserved so far is a lower bound.`,
        criteria: DEMAND_CRITERIA,
      },
    ]),
  );

const timeoutAfter = (milliseconds: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Clef gave no answer in ${milliseconds} ms`)), milliseconds),
  );

export const createClefDemandAdvisor = ({ ai }: { ai: Ai }) => {
  const advisor: DemandAdvisor = {
    adviseOn: async (day) => {
      const response = await Promise.race([
        ai.run(CLEF_MODEL_ID, {
          model: CLEF_MODEL,
          state: stateOf(day),
          questions: questionsOf(day),
        }),
        timeoutAfter(TIMEOUT_MS),
      ]);
      const { answers } = responseSchema.parse(response);
      const demands = day.products.flatMap(({ productId }) => {
        const answer = answers[questionIdOf(productId)];

        return answer ? [{ productId, probabilities: answer.probabilities }] : [];
      });

      return demands;
    },
  };

  return advisor;
};

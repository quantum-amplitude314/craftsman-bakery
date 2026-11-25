import { customerContract } from "./customer.ts";
import { staffContract } from "./staff.ts";

export const contract = {
  customer: customerContract,
  staff: staffContract,
};

export type Contract = typeof contract;

export * from "./schemas.ts";

import "server-only";

import { type Contract, contract } from "@craftsman-bakery/contracts";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { cookies, headers as requestHeaders } from "next/headers";
import { apiFetch, getApiBaseUrl } from "@/lib/api-fetch";

const link = new OpenAPILink(contract, {
  url: getApiBaseUrl,
  headers: async () => {
    const cookieStore = await cookies();
    const visitorIp = (await requestHeaders()).get("cf-connecting-ip");
    // The API passes the visitor's IP on to Turnstile's siteverify.
    const forwarded = {
      cookie: cookieStore.toString(),
      ...(visitorIp && { "cf-connecting-ip": visitorIp }),
    };

    return forwarded;
  },
  fetch: (request, init) => apiFetch(new Request(request, init)),
});

/** Server-side API client that forwards the visitor's cookies and IP. */
export const apiClient: JsonifiedClient<ContractRouterClient<Contract>> = createORPCClient(link);

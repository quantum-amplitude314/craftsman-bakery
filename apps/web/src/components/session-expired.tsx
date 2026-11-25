"use client";

import { useEffect } from "react";
import { signOut } from "@/app/staff/auth-actions";

/**
 * Stands in for a staff page whose session the API rejected: signs out, which clears the cookie
 * and opens sign-in. Without it the proxy would send sign-in straight back.
 */
export function SessionExpired() {
  useEffect(() => {
    void signOut();
  }, []);

  return null;
}

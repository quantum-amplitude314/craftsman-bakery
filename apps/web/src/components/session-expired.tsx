"use client";

import { useEffect } from "react";
import { signOut } from "@/app/staff/auth-actions";

export function SessionExpired() {
  useEffect(() => {
    void signOut();
  }, []);

  return null;
}

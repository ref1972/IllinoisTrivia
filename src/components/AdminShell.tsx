"use client";

import { useEffect } from "react";

export default function AdminShell() {
  useEffect(() => {
    document.body.dataset.admin = "true";
    return () => {
      delete document.body.dataset.admin;
    };
  }, []);

  return null;
}

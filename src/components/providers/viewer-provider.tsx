"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface Viewer {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
}

const ViewerContext = createContext<Viewer | null>(null);

export function ViewerProvider({ viewer, children }: { viewer: Viewer | null; children: ReactNode }) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  return useContext(ViewerContext);
}

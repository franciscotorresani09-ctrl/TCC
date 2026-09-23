"use client";

import { useState } from "react";

/**
 * Local state that resets whenever the incoming value changes (e.g. after a
 * server refresh), using React's "adjust state during render" pattern instead
 * of an effect.
 */
export function useSyncedState<T>(value: T) {
  const [state, setState] = useState(value);
  const [prev, setPrev] = useState(value);
  if (!Object.is(value, prev)) {
    setPrev(value);
    setState(value);
  }
  return [state, setState] as const;
}

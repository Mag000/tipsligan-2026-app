import { createContext, useContext } from "react";
import { BaseStat } from "../services/StandingsCalculationService";

export interface AppDataContextValue {
  /** All base stats for the current year — fetched once on app startup. */
  baseStats: BaseStat[];
  /** True while the initial base stats fetch is in flight. */
  baseStatsLoading: boolean;
  /** userId (uppercased) → display name for every active user. */
  userDisplayNames: Record<string, string>;
}

export const AppDataContext = createContext<AppDataContextValue>({
  baseStats: [],
  baseStatsLoading: true,
  userDisplayNames: {},
});

/** Convenience hook — throws if used outside of AppDataContext.Provider. */
export function useAppData(): AppDataContextValue {
  return useContext(AppDataContext);
}

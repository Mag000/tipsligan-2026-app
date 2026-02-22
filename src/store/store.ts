import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import bettingReducer from "./bettingSlice";
import chronicleCommentsReducer from "./chronicleCommentsSlice";
import chronicleReducer from "./chronicleSlice";
import roundsReducer from "./roundsSlice";

export const store = configureStore({
  reducer: {
    rounds: roundsReducer,
    chronicle: chronicleReducer,
    chronicleComments: chronicleCommentsReducer,
    betting: bettingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability check
        ignoredActions: ["rounds/fetchRoundData/fulfilled"],
        // Ignore these paths in the state
        ignoredPaths: ["rounds.roundsData"],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use throughout the app
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

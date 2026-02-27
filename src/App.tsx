import {
  FluentProvider,
  Spinner,
  webLightTheme,
} from "@fluentui/react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useParams,
} from "react-router-dom";
import "./App.css";
import { PageContainer } from "./components/PageContainer";
import Betting from "./pages/Betting";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Rounds from "./pages/Rounds";
import Standings from "./pages/Standings";
import { APIManager } from "./services/APIManager";
import { Round, RoundData } from "./store/roundsSlice";
import { BackendUser } from "./types/backend";
import { roundSet } from "./types/round";
import { getStoredAuthToken, getUserIdFromJwt } from "./utils/authToken";

export type { Round, RoundData };

// Context type for passing round data
export interface AppContextType {
  currentRound: number | null;
  setCurrentRound: (round: number) => void;
  userId: string;
}

// Redirect component for /rounds route.
// Calls GET /api/round/latest-synced once on mount (Constitution Principle VI —
// navigation to /rounds is a user action / URL change).
function RoundsRedirect({
  availableRounds,
  currentRound,
  onRoundsUpdated,
}: {
  availableRounds: Round[];
  currentRound: number | null;
  /** Refresh availableRounds in App state when new rounds have been synced. */
  onRoundsUpdated: () => Promise<void>;
}) {
  const [syncedRound, setSyncedRound] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  // Guard against React StrictMode double-invoking the effect in development
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    const sync = async () => {
      const latest = await APIManager.getLatestSyncedRound();
      if (latest !== null) {
        // If new rounds appeared, refresh the round selector list
        const knownMax = availableRounds[0]?.SPRoundNum ?? 0;
        if (latest > knownMax) {
          await onRoundsUpdated();
        }
        setSyncedRound(latest);
      } else {
        // Fallback to pre-loaded state when sync call fails
        setSyncedRound(currentRound ?? availableRounds[0]?.SPRoundNum ?? null);
      }
      setIsSyncing(false);
    };
    sync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally run once on mount

  if (isSyncing) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <Spinner size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!syncedRound) {
    // Last-resort fallback if both sync and pre-loaded state are unavailable
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <Spinner size="large" />
        </div>
      </PageContainer>
    );
  }

  return <Navigate to={`/rounds/${syncedRound}`} replace />;
}

// Wrapper component for Rounds route to get URL parameter
function RoundsWrapper({
  availableRounds,
  userId,
  userDisplayNames,
}: {
  availableRounds: Round[];
  userId: string;
  userDisplayNames: Record<string, string>;
}) {
  const { round: urlRound } = useParams<{ round: string }>();
  const roundNumber = urlRound ? parseInt(urlRound, 10) : null;

  return (
    <Rounds
      currentRound={roundNumber}
      availableRounds={availableRounds}
      userId={userId}
      userDisplayNames={userDisplayNames}
    />
  );
}

function App() {
  // Centralized state for rounds and bets
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [availableRounds, setAvailableRounds] = useState<Round[]>([]);
  const [token, setToken] = useState<string | null>(getStoredAuthToken());
  const [userDisplayNames, setUserDisplayNames] = useState<
    Record<string, string>
  >({});

  // Derive userId from the stored JWT token
  const userId = useMemo(() => {
    if (!token) return "";
    return getUserIdFromJwt(token) ?? "";
  }, [token]);

  // Track if initialization has run to ensure it only runs once per page load
  const hasInitialized = useRef(false);

  // Refresh the availableRounds list after a sync reveals new rounds
  const refreshAvailableRounds = useCallback(async () => {
    try {
      const rounds = await APIManager.getAllRounds();
      const roundsWithData: Round[] = rounds
        .map((r: roundSet) => ({
          id: r.Id,
          SPRoundNum: r.SPRoundNum,
          Year: r.Year,
          Week: r.Week,
          Month: r.Month,
          Comment: r.Comment,
          Finished: r.Finished || false,
        }))
        .filter((r: Round) => r.SPRoundNum)
        .sort((a: Round, b: Round) => b.SPRoundNum - a.SPRoundNum);
      setAvailableRounds(roundsWithData);
    } catch (error) {
      console.error("❌ Failed to refresh available rounds:", error);
    }
  }, []);

  // Fetch Svenska Spel draws once at startup (requires authentication)
  useEffect(() => {
    const initializeRounds = async () => {
      // Skip if already initialized
      if (hasInitialized.current) {
        console.log("⏭️ Already initialized, skipping...");
        return;
      }

      // If not authenticated, skip initialization and let the login page render
      if (!token) {
        console.log("⏳ Not authenticated, skipping round initialization");
        return;
      }

      // Mark as initialized
      hasInitialized.current = true;

      console.log(
        "🎰 Fetching Svenska Spel draws and ensuring rounds on app startup...",
      );

      try {
        console.log("✅ Rounds initialized successfully");

        // Fetch available rounds (we're already authenticated at this point).
        // New-round detection now happens lazily in RoundsRedirect via /api/round/latest-synced.
        const rounds = await APIManager.getAllRounds();

        const roundsWithData: Round[] = rounds
          .map((r: roundSet) => ({
            id: r.Id,
            SPRoundNum: r.SPRoundNum,
            Year: r.Year,
            Week: r.Week,
            Month: r.Month,
            Comment: r.Comment,
            Finished: r.Finished || false,
          }))
          .filter((r: Round) => r.SPRoundNum)
          .sort((a: Round, b: Round) => b.SPRoundNum - a.SPRoundNum); // Sort descending

        setAvailableRounds(roundsWithData);

        // Fetch userId → UserName map once for the whole app session
        try {
          const users: BackendUser[] = await APIManager.getAllActiveUsers();
          const displayNames: Record<string, string> = {};
          users.forEach((user) => {
            const uid = (user.UserId || user.userId || "")
              .toString()
              .toUpperCase();
            const name = user.UserName || user.userName || "";
            if (uid) displayNames[uid] = name;
          });
          setUserDisplayNames(displayNames);
          console.log(
            `✅ Loaded ${Object.keys(displayNames).length} user display names`,
          );
        } catch (error) {
          console.warn("⚠️ Could not fetch user display names:", error);
        }

        // Set latest round as current
        if (roundsWithData.length > 0) {
          const latestRound = roundsWithData[0].SPRoundNum;
          setCurrentRound(latestRound);
        }
      } catch (error) {
        console.error("❌ Failed to initialize rounds:", error);
      }
    };
    initializeRounds();
  }, []); // Empty dependency array - only run once on mount

  // Show loading spinner while initializing rounds (only if authenticated)
  // if (availableRounds.length === 0 && token) {
  //   return (
  //     <FluentProvider theme={webLightTheme}>
  //       <div className={styles.loadingContainer}>
  //         <Spinner size="large" />
  //         <Body1>{"Hämtar omgångar..."}</Body1>
  //       </div>
  //     </FluentProvider>
  //   );
  // }

  // If no token, show login page immediately
  if (!getStoredAuthToken()) {
    return (
      <FluentProvider theme={webLightTheme}>
        <Router>
          <Routes>
            <Route
              path="*"
              element={<Login onSuccess={(newToken) => setToken(newToken)} />}
            />
          </Routes>
        </Router>
      </FluentProvider>
    );
  }

  // If authenticated, show the main app
  return (
    <FluentProvider theme={webLightTheme}>
      <Router>
        {/* <RoundSync
          availableRounds={availableRounds}
          currentRound={currentRound}
          setCurrentRound={setCurrentRound}
        /> */}

        <Routes>
          <Route
            path="/login"
            element={<Login onSuccess={(newToken) => setToken(newToken)} />}
          />
          <Route path="/" element={<Home />} />

          <Route
            path="/rounds"
            element={
              <RoundsRedirect
                availableRounds={availableRounds}
                currentRound={currentRound}
                onRoundsUpdated={refreshAvailableRounds}
              />
            }
          />

          <Route
            path="/rounds/:round"
            element={
              <RoundsWrapper
                availableRounds={availableRounds}
                userId={userId}
                userDisplayNames={userDisplayNames}
              />
            }
          />

          <Route path="/standings/:scope" element={<Standings />} />
          <Route
            path="/standings"
            element={<Navigate replace to="/standings/year" />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/betting" element={<Betting />} />
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </FluentProvider>
  );
}

export default App;

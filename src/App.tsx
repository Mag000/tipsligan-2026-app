import {
  FluentProvider,
  makeStyles,
  shorthands,
  Spinner,
  webLightTheme,
} from "@fluentui/react-components";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useParams,
} from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Rounds from "./pages/Rounds";
import Standings from "./pages/Standings";
import { APIManager } from "./services/APIManager";
import { SvenskaSpelResponse } from "./types/svenskaspel";
import { getStoredAuthToken } from "./utils/authToken";

// Define types for our centralized state
export interface UserBet {
  matchId: string;
  eventNumber: number;
  bets: Array<"1" | "X" | "2">;
  isSafe: boolean;
  isFinalized: boolean;
}

export interface RoundData {
  drawInfo: SvenskaSpelResponse | null;
  userBets: Record<number, UserBet>;
  safeMatchNumber: number | null;
  isFinalized: boolean;
  allUsersBets: Record<string, Record<number, UserBet>>;
  distribution: Record<number, { "1": number; X: number; "2": number }>;
}

export interface Round {
  id?: number;
  SPRoundNum: number;
  Year: number;
  Week: number;
  Month?: number;
  Comment?: string;
  Finished?: boolean;
}

// Context type for passing round data
export interface AppContextType {
  currentRound: number | null;
  setCurrentRound: (round: number) => void;
  roundsData: Record<number, RoundData>;
  loadRoundData: (round: number, force?: boolean) => Promise<void>;
  userId: string;
}

// Redirect component for /rounds route
function RoundsRedirect({
  availableRounds,
  currentRound,
}: {
  availableRounds: Round[];
  currentRound: number | null;
}) {
  // Wait for rounds to be loaded before redirecting
  if (!currentRound && availableRounds.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }

  const targetRound = currentRound || availableRounds[0]?.SPRoundNum || 1;
  return <Navigate to={`/rounds/${targetRound}`} replace />;
}

// Wrapper component for Rounds route to get URL parameter
function RoundsWrapper({
  roundsData,
  loadRoundData,
  availableRounds,
}: {
  roundsData: Record<number, RoundData>;
  loadRoundData: (round: number, force?: boolean) => Promise<void>;
  availableRounds: Round[];
}) {
  const { round: urlRound } = useParams<{ round: string }>();
  const roundNumber = urlRound ? parseInt(urlRound, 10) : null;

  return (
    <Rounds
      currentRound={roundNumber}
      roundData={roundNumber ? roundsData[roundNumber] : undefined}
      loadRoundData={loadRoundData}
      availableRounds={availableRounds}
    />
  );
}

const useStyles = makeStyles({
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    ...shorthands.gap("16px"),
  },
});

function App() {
  const styles = useStyles();

  // Centralized state for rounds and bets
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [roundsData, setRoundsData] = useState<Record<number, RoundData>>({});
  const [availableRounds, setAvailableRounds] = useState<Round[]>([]);
  const [token, setToken] = useState<string | null>(getStoredAuthToken());

  // Track if initialization has run to ensure it only runs once per page load
  const hasInitialized = useRef(false);

  // Check authentication status first to avoid unnecessary initialization
  //const token = getStoredAuthToken();
  const [isInitializing, setIsInitializing] = useState<boolean>(!!token);

  // Load round data function
  const loadRoundData = useCallback(
    async (round: number, force: boolean = false) => {
      // Skip if already loaded (unless forced)
      if (!force && roundsData[round]?.drawInfo) {
        console.log(`✅ Round ${round} already loaded`);
        return;
      }

      try {
        console.log(`🔍 Loading data for round ${round}...`);

        // Fetch draw info
        const drawInfo = await APIManager.getSvenskaSpelDrawInfo(round);

        // Check if results are needed
        const shouldFetchResults =
          drawInfo.draw.drawState?.toLowerCase() === "finalized" ||
          drawInfo.draw.drawState?.toLowerCase() === "result";

        if (shouldFetchResults) {
          try {
            const resultInfo = await APIManager.getSvenskaSpelDrawResult(round);
            // Merge results into draw info
            const resultEvents = resultInfo.result.events || [];
            drawInfo.draw.events = drawInfo.draw.events.map((forecastEvent) => {
              const resultEvent = resultEvents.find(
                (re) => re.eventNumber === forecastEvent.eventNumber,
              );
              if (resultEvent?.outcomeScore) {
                return {
                  ...forecastEvent,
                  outcomeScore: resultEvent.outcomeScore,
                  sportEventStatus: "Slut",
                };
              }
              return forecastEvent;
            });
          } catch (error) {
            console.warn("⚠️ Could not fetch results:", error);
          }
        }

        // Step 1: Get matches to build matchId -> eventNumber map
        const roundMatches = await APIManager.getMatchesForRound(round);
        const matchIdToEventNumber = new Map<number, number>();
        roundMatches.forEach((match: any) => {
          const matchIdRaw = match.Id || match.id || match.ID;
          const matchId =
            typeof matchIdRaw === "string"
              ? parseInt(matchIdRaw, 10)
              : matchIdRaw;
          const eventNum =
            match.MatchNumber ||
            match.matchNumber ||
            match.EventNumber ||
            match.eventNumber;
          if (matchId && eventNum) {
            matchIdToEventNumber.set(matchId, eventNum);
          }
        });

        // Step 2: Fetch user bets
        const betsData = await APIManager.getUserBetsForRound(round);
        const betsMap: Record<number, UserBet> = {};
        let safeBet: number | null = null;
        let finalized = false;

        betsData.forEach((bet: any) => {
          // Get matchId from bet
          const matchId =
            bet.matchesId || bet.matchesSet_Id || bet.MatchId || bet.matchId;

          // Get eventNumber from our map
          const eventNum = matchIdToEventNumber.get(matchId);

          if (!eventNum) return; // Skip if we can't find the event number

          // Get bet value
          const betValue = bet.bet || bet.Bet || bet.tip || bet.Tip;
          const normalizedBet = betValue?.toString().toUpperCase();

          // Initialize or get existing bets for this event
          if (!betsMap[eventNum]) {
            betsMap[eventNum] = {
              matchId: bet.Id || bet.id,
              eventNumber: eventNum,
              bets: [],
              isSafe: false,
              isFinalized: bet.Final === true || bet.final === true,
            };
          }

          // Add bet if valid and not duplicate (for halvgardering)
          if (
            normalizedBet &&
            (normalizedBet === "1" ||
              normalizedBet === "X" ||
              normalizedBet === "2") &&
            !betsMap[eventNum].bets.includes(normalizedBet as "1" | "X" | "2")
          ) {
            betsMap[eventNum].bets.push(normalizedBet as "1" | "X" | "2");
          }

          // Set safe match
          const isSafe =
            bet.safe || bet.Safe || bet.isSafe || bet.IsSafe || false;
          if (isSafe) {
            safeBet = eventNum;
            betsMap[eventNum].isSafe = true;
          }

          // Update finalized status
          const isBetFinalized = bet.Final === true || bet.final === true;
          if (isBetFinalized) {
            finalized = true;
          }
        });

        // Step 3: Fetch all users' bets
        const allBetsData = await APIManager.getBetsForRound(round);
        const allUsersBets: Record<string, Record<number, UserBet>> = {};

        allBetsData.forEach((bet: any) => {
          const betUserId = String(bet.aspnet_UsersUserId).toUpperCase();
          if (!allUsersBets[betUserId]) {
            allUsersBets[betUserId] = {};
          }

          // Get matchId from bet
          const matchId =
            bet.matchesId || bet.matchesSet_Id || bet.MatchId || bet.matchId;

          // Get eventNumber from our map
          const eventNum = matchIdToEventNumber.get(matchId);

          if (!eventNum) return; // Skip if we can't find the event number

          // Get bet value
          const betValue = bet.bet || bet.Bet || bet.tip || bet.Tip;
          const normalizedBet = betValue?.toString().toUpperCase();

          // Initialize or get existing bets for this event
          if (!allUsersBets[betUserId][eventNum]) {
            allUsersBets[betUserId][eventNum] = {
              matchId: bet.Id || bet.id,
              eventNumber: eventNum,
              bets: [],
              isSafe: bet.safe || bet.Safe || bet.isSafe || bet.IsSafe || false,
              isFinalized: bet.Final === true || bet.final === true,
            };
          }

          // Add bet if valid and not duplicate (for halvgardering)
          if (
            normalizedBet &&
            (normalizedBet === "1" ||
              normalizedBet === "X" ||
              normalizedBet === "2") &&
            !allUsersBets[betUserId][eventNum].bets.includes(
              normalizedBet as "1" | "X" | "2",
            )
          ) {
            allUsersBets[betUserId][eventNum].bets.push(
              normalizedBet as "1" | "X" | "2",
            );
          }
        });

        // Fetch distribution if finalized
        let distributionMap: Record<
          number,
          { "1": number; X: number; "2": number }
        > = {};

        if (shouldFetchResults) {
          try {
            const distributionData =
              await APIManager.getDistributionForRound(round);

            if (Array.isArray(distributionData)) {
              distributionData.forEach((item: any, index: number) => {
                if (typeof item === "string") {
                  const match = item.match(/^(\d+)\s+(\d+)\s+(\d+)/);
                  if (match) {
                    const matchNumber = index + 1;
                    distributionMap[matchNumber] = {
                      "1": parseInt(match[1], 10),
                      X: parseInt(match[2], 10),
                      "2": parseInt(match[3], 10),
                    };
                  }
                } else {
                  const matchNumber =
                    item.matchNumber ||
                    item.MatchNumber ||
                    item.eventNumber ||
                    item.EventNumber;
                  if (matchNumber) {
                    distributionMap[matchNumber] = {
                      "1": item.count1 || item.Count1 || 0,
                      X: item.countX || item.CountX || 0,
                      "2": item.count2 || item.Count2 || 0,
                    };
                  }
                }
              });
            }
          } catch (error) {
            console.warn("⚠️ Could not fetch distribution:", error);
          }
        }

        // Store in state
        setRoundsData((prev) => ({
          ...prev,
          [round]: {
            drawInfo,
            userBets: betsMap,
            safeMatchNumber: safeBet,
            isFinalized: finalized,
            allUsersBets,
            distribution: distributionMap,
          },
        }));

        console.log(`✅ Round ${round} data loaded successfully`);
      } catch (error) {
        console.error(`❌ Failed to load round ${round}:`, error);
      }
    },
    [],
  );

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
        setIsInitializing(false);
        return;
      }

      // Mark as initialized
      hasInitialized.current = true;

      console.log(
        "🎰 Fetching Svenska Spel draws and ensuring rounds on app startup...",
      );

      try {
        console.log("✅ Rounds initialized successfully");

        // Fetch available rounds (we're already authenticated at this point)
        let rounds = await APIManager.getAllRounds();

        //Check if there is a round in svenskaspel that is not in our rounds list

        //I want the highest sp round number from rounds
        const highestSPRoundNum = rounds.reduce(
          (max: number, r: any) =>
            r.SPRoundNum && r.SPRoundNum > max ? r.SPRoundNum : max,
          0,
        );

        //Check if there is a higher number in svenska spel draw info
        const svenskaspelDraw = await APIManager.getSvenskaSpelDrawInfo(
          highestSPRoundNum + 1,
        );
        if (svenskaspelDraw.draw) {
          //Add the new round to the database
          // Create the round
          const createdRound = await APIManager.createRoundFromSvenskaSpelDraw(
            svenskaspelDraw.draw.drawNumber,
          );
          //Add to rounds array
          rounds.push(createdRound);
          console.log(
            `➕ Added new round ${createdRound.SPRoundNum} from Svenska Spel draw info`,
          );
        }

        const roundsWithData: Round[] = rounds
          .map((r: any) => ({
            id: r.id || r.Id,
            SPRoundNum: r.SPRoundNum || r.spRoundNum || r.roundNumber || r.id,
            Year: r.Year || r.year || new Date().getFullYear(),
            Week: r.Week || r.week || 1,
            Month: r.Month || r.month,
            Comment: r.Comment || r.comment,
            Finished: r.Finished || r.finished || false,
          }))
          .filter((r: Round) => r.SPRoundNum)
          .sort((a: Round, b: Round) => b.SPRoundNum - a.SPRoundNum); // Sort descending

        setAvailableRounds(roundsWithData);

        // Set latest round as current and load its data
        if (roundsWithData.length > 0) {
          const latestRound = roundsWithData[0].SPRoundNum;
          setCurrentRound(latestRound);

          // Load the round data before finishing initialization
          console.log(
            `📊 Loading initial round data for round ${latestRound}...`,
          );
          await loadRoundData(latestRound);
        }
      } catch (error) {
        console.error("❌ Failed to initialize rounds:", error);
      } finally {
        setIsInitializing(false);
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
              />
            }
          />

          <Route
            path="/rounds/:round"
            element={
              <RoundsWrapper
                roundsData={roundsData}
                loadRoundData={loadRoundData}
                availableRounds={availableRounds}
              />
            }
          />

          <Route path="/standings" element={<Standings />} />
          <Route path="/profile" element={<Profile />} />
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </FluentProvider>
  );
}

export default App;

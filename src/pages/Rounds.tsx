import {
  Badge,
  Body1,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  makeStyles,
  Option,
  shorthands,
  Spinner,
  Title1,
  Toast,
  ToastBody,
  Toaster,
  ToastTitle,
  tokens,
  Tooltip,
  useId,
  useToastController,
} from "@fluentui/react-components";
import {
  ArrowSync20Regular,
  ChevronDownRegular,
  ChevronRightRegular,
  DismissRegular,
  LockClosedRegular,
  ShieldCheckmarkRegular,
  Sport24Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { APIManager } from "../services/APIManager";
import { Round, RoundData, UserBet } from "../store/roundsSlice";
import {
  BackendBet,
  BackendDistributionItem,
  BackendMatch,
} from "../types/backend";
import { getStoredAuthToken, getUserIdFromJwt } from "../utils/authToken";

import { useLanguage } from "../contexts/LanguageContext";
import { useGlobalStyles } from "../styles/globalStyles";
import { DrawEvent, Participant } from "../types/svenskaspel";

const useStyles = makeStyles({
  matchNumber: {
    width: "32px",
    height: "32px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    flexShrink: 0,
  },
  teams: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.gap("16px"),
    marginBottom: "16px",
  },
  teamName: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  homeTeam: {
    textAlign: "right",
  },
  awayTeam: {
    textAlign: "left",
  },
  score: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    minWidth: "80px",
    justifyContent: "center",
  },
  scoreSeparator: {
    color: tokens.colorNeutralForeground3,
  },
  statusBadge: {
    ...shorthands.borderRadius("4px"),
    fontSize: tokens.fontSizeBase200,
    marginLeft: "auto",
  },
  matchInfo: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
    marginBottom: "12px",
  },
  leagueInfo: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  // Svenska Spel Info Section - Table-based
  statsTable: {
    marginTop: "8px",
    ...shorthands.padding("8px"),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.overflow("hidden"),
  },
  tableContainer: {
    width: "100%",
    ...shorthands.overflow("auto"),
  },
  statsTableElement: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: tokens.fontSizeBase200,
  },
  tableHeader: {
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableHeaderCell: {
    ...shorthands.padding("6px", "4px"),
    textAlign: "center",
    ...shorthands.borderBottom("2px", "solid", tokens.colorNeutralStroke2),
  },
  tableRow: {
    ":nth-child(even)": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  tableCell: {
    ...shorthands.padding("6px", "4px"),
    textAlign: "center",
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke3),
  },
  rowLabel: {
    textAlign: "left",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding("6px", "8px"),
  },
  cellValue: {
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  infoSection: {
    flex: 1,
  },
  infoTitle: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoContent: {
    display: "flex",
    justifyContent: "space-around",
    ...shorthands.gap("8px"),
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("2px"),
  },
  infoLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  infoValue: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  newspaperTips: {
    display: "flex",
    ...shorthands.gap("4px"),
    justifyContent: "center",
  },
  newspaperTip: {
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  // Betting Section
  bettingSection: {
    marginTop: "16px",
    ...shorthands.padding("12px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  betButtons: {
    display: "flex",
    ...shorthands.gap("8px"),
    justifyContent: "center",
    marginBottom: "8px",
  },
  betButton: {
    width: "24px",
    height: "24px",
    minWidth: "24px",
    minHeight: "24px",
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding("0"),
  },
  betButtonSelected: {
    backgroundColor: `${tokens.colorBrandBackground} !important`,
    color: `${tokens.colorNeutralForegroundOnBrand} !important`,
    ...shorthands.borderColor(tokens.colorBrandBackground),
  },
  betButtonHasBet: {
    backgroundColor: `${tokens.colorPaletteGreenBackground2} !important`,
    color: `${tokens.colorNeutralForeground1} !important`,
    ...shorthands.borderColor(tokens.colorPaletteGreenBorder2),
  },
  betButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  safeCheckbox: {
    display: "flex",
    justifyContent: "center",
    marginTop: "8px",
  },
  // Comparison Section
  compareSection: {
    marginTop: "12px",
    ...shorthands.padding("12px"),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  userBetsGrid: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  userBetRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    justifyContent: "space-between",
  },
  userName: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
    minWidth: "80px",
    fontWeight: tokens.fontWeightSemibold,
  },
  myBetsLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorBrandForeground1,
    minWidth: "80px",
    fontWeight: tokens.fontWeightBold,
  },
  betBoxesContainer: {
    display: "flex",
    ...shorthands.gap("4px"),
    alignItems: "center",
  },
  betBox: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
  },
  betBoxSelected: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.borderColor(tokens.colorBrandBackground),
    color: `${tokens.colorNeutralForegroundOnBrand} !important`,
    fontWeight: tokens.fontWeightBold,
  },
  betBoxNotFinalized: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    ...shorthands.borderColor(tokens.colorPaletteYellowBorder2),
    color: tokens.colorNeutralForeground2,
    opacity: 0.7,
  },
  safeIndicator: {
    fontSize: "14px",
    color: tokens.colorStatusSuccessForeground1,
    marginLeft: "4px",
  },
  expandableRow: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  expandableRowLabel: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  expandedContent: {
    marginTop: "12px",
    ...shorthands.padding("12px"),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
  },
});

interface RoundProps {
  currentRound: number | null;
  availableRounds: Round[];
  userId: string;
  userDisplayNames: Record<string, string>;
}

export default function Rounds(props: RoundProps) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { round: urlRound } = useParams<{ round: string }>();

  // UI-only state
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(
    new Set(),
  );
  const [betFilters, setBetFilters] = useState<
    Record<number, "1" | "X" | "2" | null>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roundsCache, setRoundsCache] = useState<Record<number, RoundData>>({});

  const fetchRoundData = useCallback(
    async (round: number, force: boolean = false) => {
      if (!force && roundsCache[round]?.drawInfo) {
        console.log(`✅ Round ${round} already loaded`);
        return;
      }

      // Only show the full loading state on a true first load (no existing cache data).
      // Force-refreshes on already-loaded rounds are kept silent here;
      // isRefreshing (set by handleRefresh) provides button-level feedback instead.
      if (!roundsCache[round]?.drawInfo) {
        setIsLoading(true);
      }
      try {
        console.log(`🔍 Loading data for round ${round}...`);

        // Fetch draw info
        const drawInfo = await APIManager.getSvenskaSpelDrawInfo(round);

        const shouldFetchResults =
          drawInfo.draw.drawState?.toLowerCase() === "finalized" ||
          drawInfo.draw.drawState?.toLowerCase() === "result";

        if (shouldFetchResults) {
          try {
            const resultInfo = await APIManager.getSvenskaSpelDrawResult(round);
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
        roundMatches.forEach((match: BackendMatch) => {
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

        // Step 2: Fetch all users' bets
        const allBetsData = await APIManager.getBetsForRound(round);
        const allUsersBets: Record<string, Record<number, UserBet>> = {};

        allBetsData.forEach((bet: BackendBet) => {
          const betUserId = String(bet.aspnet_UsersUserId).toUpperCase();
          if (!allUsersBets[betUserId]) {
            allUsersBets[betUserId] = {};
          }

          const eventNum =
            bet.MatchNumber ||
            matchIdToEventNumber.get(
              typeof bet.matchesId === "string"
                ? parseInt(bet.matchesId, 10)
                : (bet.matchesId ?? 0),
            );
          if (!eventNum) return;

          const betValue = bet.bet || bet.Bet || bet.tip || bet.Tip;
          const normalizedBet = betValue?.toString().toUpperCase();

          if (!allUsersBets[betUserId][eventNum]) {
            allUsersBets[betUserId][eventNum] = {
              matchId: String(bet.Id || bet.id || 0),
              eventNumber: eventNum,
              bets: [],
              isSafe: bet.safe || bet.Safe || bet.isSafe || bet.IsSafe || false,
              isFinalized: bet.Final === true || bet.final === true,
            };
          }

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

        // Step 2b: Derive current user's bets from allUsersBets using live JWT userId
        let betsMap: Record<number, UserBet> = {};
        let safeBet: number | null = null;
        let finalized = false;

        const rawToken = getStoredAuthToken();
        if (rawToken) {
          const currentUserId = getUserIdFromJwt(rawToken);
          if (currentUserId) {
            const myBets = allUsersBets[currentUserId] || {};
            betsMap = { ...myBets };
            safeBet =
              Object.values(myBets).find((b) => b.isSafe)?.eventNumber ?? null;
            finalized = Object.values(myBets).some((b) => b.isFinalized);
          }
        }

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
              distributionData.forEach(
                (item: BackendDistributionItem | string, index: number) => {
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
                },
              );
            }
          } catch (error) {
            console.warn("⚠️ Could not fetch distribution:", error);
          }
        }

        setRoundsCache((prev) => ({
          ...prev,
          [round]: {
            drawInfo,
            userBets: betsMap,
            safeMatchNumber: safeBet,
            isFinalized: finalized,
            allUsersBets,
            distribution: distributionMap,
            loading: false,
            error: null,
            lastFetched: Date.now(),
            cacheValid: true,
            requestInFlight: false,
            fetchAttempts: 0,
          },
        }));

        console.log(`✅ Round ${round} data loaded successfully`);
      } catch (error) {
        console.error(`❌ Failed to load round ${round}:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [roundsCache],
  );

  // Toast setup
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  // Hardcoded admin status (set to false for now)
  const isAdmin = false;

  // Derive round data from local cache
  const roundNumber = urlRound ? parseInt(urlRound, 10) : null;
  const roundData = roundNumber ? roundsCache[roundNumber] : undefined;

  // Extract data from local round cache
  const userBets = roundData?.allUsersBets?.[props.userId.toUpperCase()] || {};
  const safeMatchNumber =
    Object.values(userBets).find((b) => b.isSafe)?.eventNumber ?? null;
  const isFinalized = Object.values(userBets).some((b) => b.isFinalized);
  const halvgarderingCount = useMemo(
    () => Object.values(userBets).filter((b) => b.bets.length >= 2).length,
    [userBets],
  );
  const distribution = roundData?.distribution || {};
  const drawComment = roundData?.drawInfo?.draw?.drawComment || "";
  const weekMatch = drawComment.match(/v\.\s*(\d{4})-(\d+)/);
  const weekNumber = weekMatch?.[2] || "";
  const yearNumber = weekMatch?.[1] || "";

  // Total matches in this draw — source of truth for the all-confirmed gate
  const drawEvents = roundData?.drawInfo?.draw?.events ?? [];
  const totalMatchCount = drawEvents.length;

  // Finalize is allowed only when all matches are bet on, all 7 halvgarderingar are used, and not already finalized
  // Only count matches where at least one bet choice (1/X/2) has been made — entries with bets:[] don't count
  const placedBetsCount = Object.values(userBets).filter(
    (b) => b.bets.length >= 1,
  ).length;
  const MAX_HALVGARDERINGAR = 7;
  const canFinalize =
    !isFinalized &&
    totalMatchCount > 0 &&
    placedBetsCount === totalMatchCount &&
    halvgarderingCount === MAX_HALVGARDERINGAR &&
    safeMatchNumber !== null;

  // All-confirmed: every match has a userBet with isFinalized: true
  const allConfirmed = useMemo(() => {
    if (totalMatchCount === 0) return false;
    const confirmedCount = Object.values(userBets).filter(
      (b) => b.isFinalized,
    ).length;
    return confirmedCount === totalMatchCount;
  }, [userBets, totalMatchCount]);

  // Get selected users' bets from roundData — only shown when all matches are confirmed
  const selectedUsersBets = useMemo(() => {
    if (!roundData?.allUsersBets || !allConfirmed) return {};

    const result: Record<string, Record<number, UserBet>> = {};
    Object.keys(roundData.allUsersBets).forEach((betUserId) => {
      // Exclude current user's own row
      if (betUserId === props.userId.toUpperCase()) return;
      result[betUserId] = roundData!.allUsersBets[betUserId];
    });
    return result;
  }, [roundData?.allUsersBets, allConfirmed, props.userId]);

  // Load round data when URL changes.
  // Always force=true so navigating back to a previously visited round fetches
  // fresh bets from the DB instead of returning early with stale optimistic cache.
  useEffect(() => {
    if (!roundNumber) return;
    console.log(`🔄 URL changed to round ${roundNumber}, loading data...`);
    fetchRoundData(roundNumber, true);
  }, [urlRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Round selector state
  const [roundSelectorOpen, setRoundSelectorOpen] = useState(false);

  // Round options
  const roundOptions = useMemo(() => {
    return props.availableRounds.map((round) => ({
      key: String(round.SPRoundNum),
      text: t("rounds.roundLabel", { year: round.Year, week: round.Week }),
      value: round.SPRoundNum,
    }));
  }, [props.availableRounds, t]);

  // Handle round selection
  const handleRoundSelect = (_: any, data: any) => {
    const selectedRound = parseInt(data.optionValue, 10);
    if (selectedRound) {
      navigate(`/rounds/${selectedRound}`);
      setRoundSelectorOpen(false);
    }
  };

  // Handle bet selection
  const handleBetChange = async (
    eventNumber: number,
    betType: "1" | "x" | "2",
  ) => {
    if (!allMatchesNotStarted) {
      console.log("⛔ Round has started, cannot place bets");
      return;
    }

    if (isFinalized) {
      console.log("⛔ Bets are finalized, cannot change");
      return;
    }

    if (!props.currentRound || props.currentRound <= 0) {
      console.error("❌ Invalid round number:", props.currentRound);
      return;
    }

    const round = props.currentRound;
    const currentUserId = props.userId.toUpperCase();
    // Normalize to uppercase so it matches API-loaded state ("X", not "x")
    const normalizedBetType = betType.toUpperCase() as "1" | "X" | "2";

    // Read current state synchronously for constraint checks
    const currentUserBets =
      roundsCache[round]?.allUsersBets?.[currentUserId] ?? {};
    const currentMatchBet = currentUserBets[eventNumber];
    const currentBets = currentMatchBet?.bets ?? [];
    const isRemoving = currentBets.includes(normalizedBetType);

    // Per-match cap: cannot add a 3rd sign to the same match
    if (!isRemoving && currentBets.length >= 2) {
      console.log("⛔ Per-match max 2 signs reached");
      return;
    }

    // Cannot halvgarda the safe match
    if (!isRemoving && currentBets.length === 1 && currentMatchBet?.isSafe) {
      dispatchToast(
        <Toast>
          <ToastTitle>{t("rounds.toast.cantHalvgardaSafe")}</ToastTitle>
          <ToastBody>{t("rounds.toast.cantHalvgardaSafeBody")}</ToastBody>
        </Toast>,
        { intent: "warning" },
      );
      return;
    }

    // Round halvgardering cap: max 7 halvgarderingar per round
    const currentHalvCount = Object.values(currentUserBets).filter(
      (b) => b.bets.length >= 2,
    ).length;
    const wouldBeHalv = !isRemoving && currentBets.length === 1;
    if (wouldBeHalv && currentHalvCount >= 7) {
      dispatchToast(
        <Toast>
          <ToastTitle>{t("rounds.toast.maxHalvgarderingar")}</ToastTitle>
          <ToastBody>{t("rounds.toast.maxHalvgarderingarBody")}</ToastBody>
        </Toast>,
        { intent: "warning" },
      );
      return;
    }

    // Compute toggled bets array
    const newBets = isRemoving
      ? currentBets.filter((b) => b !== normalizedBetType)
      : [...currentBets, normalizedBetType];

    // Snapshot previous state so we can roll back if the save fails
    const previousBet = currentMatchBet;

    // Optimistic update — reflect the selection immediately before awaiting the API
    setRoundsCache((prev) => {
      const prevRound = prev[round];
      if (!prevRound) return prev;
      const prevUserBets = prevRound.allUsersBets?.[currentUserId] ?? {};
      const prevMatchBet = prevUserBets[eventNumber];
      return {
        ...prev,
        [round]: {
          ...prevRound,
          allUsersBets: {
            ...prevRound.allUsersBets,
            [currentUserId]: {
              ...prevUserBets,
              [eventNumber]: {
                matchId: prevMatchBet?.matchId ?? String(eventNumber),
                eventNumber,
                bets: newBets,
                isSafe: prevMatchBet?.isSafe ?? false,
                isFinalized: prevMatchBet?.isFinalized ?? false,
              },
            },
          },
        },
      };
    });

    // Save to backend (fire and forget — invisible to user)
    try {
      await APIManager.saveBet(round, eventNumber, betType);
      console.log(`✅ Bet saved for match ${eventNumber}`);
    } catch (error) {
      console.error("Failed to save bet:", error);

      // Revert optimistic update on failure
      setRoundsCache((prev) => {
        const prevRound = prev[round];
        if (!prevRound) return prev;
        const revertedUserBets = {
          ...prevRound.allUsersBets?.[currentUserId],
        };
        if (previousBet === undefined) {
          delete revertedUserBets[eventNumber];
        } else {
          revertedUserBets[eventNumber] = previousBet;
        }
        return {
          ...prev,
          [round]: {
            ...prevRound,
            allUsersBets: {
              ...prevRound.allUsersBets,
              [currentUserId]: revertedUserBets,
            },
          },
        };
      });

      dispatchToast(
        <Toast>
          <ToastTitle>{t("rounds.toast.saveFailed")}</ToastTitle>
          <ToastBody>{t("rounds.toast.saveFailedBody")}</ToastBody>
        </Toast>,
        { intent: "error" },
      );
    }
  };

  // Handle safe match toggle
  const handleSafeToggle = async (eventNumber: number) => {
    if (isFinalized) return;

    const round = props.currentRound;
    if (!round || round <= 0) return;

    const currentUserId = props.userId.toUpperCase();
    const isCurrentlySafe = safeMatchNumber === eventNumber;
    // Clicking the current safe match clears it; clicking another sets it
    const newSafeMatchNumber = isCurrentlySafe ? null : eventNumber;

    // Optimistic update: clear safe on all, set on target
    setRoundsCache((prev) => {
      const prevRound = prev[round];
      if (!prevRound) return prev;
      const prevUserBets = {
        ...(prevRound.allUsersBets?.[currentUserId] ?? {}),
      };
      const updated: typeof prevUserBets = {};
      for (const key of Object.keys(prevUserBets)) {
        const evNum = Number(key);
        updated[evNum] = {
          ...prevUserBets[evNum],
          isSafe: newSafeMatchNumber !== null && evNum === newSafeMatchNumber,
        };
      }
      return {
        ...prev,
        [round]: {
          ...prevRound,
          allUsersBets: {
            ...prevRound.allUsersBets,
            [currentUserId]: updated,
          },
        },
      };
    });

    try {
      await APIManager.setSafeMatch(round, newSafeMatchNumber ?? 0);
    } catch (error) {
      console.error("Failed to set safe match:", error);
      // Revert by reloading fresh data
      await fetchRoundData(round, true);
    }
  };

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (!props.currentRound) {
      console.error("❌ No current round to refresh");
      return;
    }

    setIsRefreshing(true);
    try {
      await fetchRoundData(props.currentRound, true);

      // Show success toast
      dispatchToast(
        <Toast>
          <ToastTitle>{t("rounds.toast.refreshed")}</ToastTitle>
        </Toast>,
        { intent: "success", timeout: 2000 },
      );

      console.log(`✅ Round ${props.currentRound} data refreshed`);
    } catch (error) {
      console.error("❌ Failed to refresh data:", error);

      // Show error toast
      dispatchToast(
        <Toast>
          <ToastTitle>{t("rounds.toast.refreshFailed")}</ToastTitle>
          <ToastBody>{t("common.retry")}</ToastBody>
        </Toast>,
        { intent: "error" },
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [props.currentRound, fetchRoundData, dispatchToast]);

  // Handle finalize
  const handleFinalizeRound = async () => {
    if (!props.currentRound || props.currentRound <= 0) {
      console.error("❌ Invalid round number:", props.currentRound);
      return;
    }

    try {
      // userId is extracted from Bearer token on the backend
      await APIManager.finalizeRound(props.currentRound);
      setShowFinalizeDialog(false);
      console.log("✅ Round finalized");

      // Reload round data to get fresh state
      await fetchRoundData(props.currentRound, true);
    } catch (error) {
      console.error("Failed to finalize round:", error);
    }
  };

  // Get match status and result
  const getMatchStatus = (event: DrawEvent) => {
    const status = event.sportEventStatus;

    if (status === "finished" || status === "Finished" || status === "Slut") {
      // outcomeScore is a string like "1-0"
      const outcomeScore = (event as any).outcomeScore;

      if (outcomeScore && typeof outcomeScore === "string") {
        const scoreParts = outcomeScore.split("-");

        if (scoreParts.length === 2) {
          const homeScore = scoreParts[0].trim();
          const awayScore = scoreParts[1].trim();
          const homeScoreNum = parseInt(homeScore, 10);
          const awayScoreNum = parseInt(awayScore, 10);

          // Determine the winning outcome
          let outcome: "1" | "X" | "2";
          if (homeScoreNum > awayScoreNum) {
            outcome = "1";
          } else if (homeScoreNum < awayScoreNum) {
            outcome = "2";
          } else {
            outcome = "X";
          }

          return {
            status: "finished" as const,
            result: `${homeScore} - ${awayScore}`,
            outcome,
          };
        }
      }

      return { status: "finished" as const, result: null, outcome: null };
    }

    if (status === "started" || status === "Started") {
      return { status: "started" as const, result: null, outcome: null };
    }

    return { status: "not-started" as const, result: null, outcome: null };
  };

  // Derived: true only when every event in the round has not yet started
  const allMatchesNotStarted = useMemo(() => {
    if (!drawEvents || drawEvents.length === 0) return false;
    return drawEvents.every(
      (event) => getMatchStatus(event).status === "not-started",
    );
  }, [drawEvents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate newspaper tips distribution
  const getNewspaperTipsArray = (event: DrawEvent) => {
    const advice = event.newspaperAdvice;
    if (!advice) return [];

    const home = parseInt(advice.home) || 0;
    const draw = parseInt(advice.draw) || 0;
    const away = parseInt(advice.away) || 0;
    const total = home + draw + away;

    if (total === 0) return [];

    // Create array with the tips
    const tips: Array<"1" | "X" | "2"> = [];
    for (let i = 0; i < home; i++) tips.push("1");
    for (let i = 0; i < draw; i++) tips.push("X");
    for (let i = 0; i < away; i++) tips.push("2");

    return tips;
  };

  // Full-page spinner: ONLY on true first load (no data yet in cache for this round).
  // isRefreshing does NOT trigger a full-page blank — button-level feedback is sufficient.
  if (isLoading && !roundData?.drawInfo) {
    return (
      <PageContainer>
        <div className={globalStyles.loadingContainer}>
          <Spinner size="large" />
          <Body1>{t("rounds.loading")}</Body1>
        </div>
      </PageContainer>
    );
  }

  // Don't render if no round selected
  if (!props.currentRound) {
    return (
      <PageContainer>
        <div className={globalStyles.loadingContainer}>
          <Spinner size="large" />
          <Body1>{t("rounds.loading")}</Body1>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={globalStyles.pageHeader}>
        <div className={globalStyles.flexRowWrap}>
          <Title1
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
            onClick={() => setRoundSelectorOpen(!roundSelectorOpen)}
          >
            <Sport24Regular style={{ verticalAlign: "middle" }} />
            {weekNumber && yearNumber
              ? t("rounds.roundLabel", { year: yearNumber, week: weekNumber })
              : ""}
            {roundSelectorOpen ? (
              <ChevronDownRegular style={{ fontSize: "20px" }} />
            ) : (
              <ChevronRightRegular style={{ fontSize: "20px" }} />
            )}
          </Title1>
          {roundSelectorOpen && (
            <Dropdown
              placeholder={t("rounds.selectRound")}
              value={
                roundOptions.find((opt) => opt.value === props.currentRound)
                  ?.text ||
                t("rounds.currentRoundFallback", { round: props.currentRound })
              }
              selectedOptions={[String(props.currentRound)]}
              onOptionSelect={handleRoundSelect}
              open={roundSelectorOpen}
              onOpenChange={(_e: any, data: any) =>
                setRoundSelectorOpen(data.open)
              }
              style={{ marginTop: "8px", minWidth: "250px" }}
            >
              {roundOptions.map((option) => (
                <Option key={option.key} value={String(option.value)}>
                  {option.text}
                </Option>
              ))}
            </Dropdown>
          )}
          {!isFinalized && halvgarderingCount > 0 && (
            <Badge appearance="filled" color="informative">
              {t("rounds.halvgarderingar", {
                count: halvgarderingCount,
                max: MAX_HALVGARDERINGAR,
              })}
            </Badge>
          )}
          {isFinalized && (
            <Badge appearance="filled" color="success">
              <LockClosedRegular
                style={{ marginRight: "4px", verticalAlign: "middle" }}
              />
              {t("rounds.finalized")}
            </Badge>
          )}
          {roundData?.drawInfo?.draw?.drawState &&
            roundData.drawInfo.draw.drawState.toLowerCase() !== "open" && (
              <Button
                appearance="primary"
                icon={<ArrowSync20Regular />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{ marginLeft: "auto" }}
              >
                {isRefreshing ? t("rounds.refreshing") : t("rounds.refresh")}
              </Button>
            )}
        </div>
      </div>

      <Toaster toasterId={toasterId} />

      <div className={globalStyles.list}>
        {roundData &&
          props.currentRound &&
          roundData.drawInfo?.draw.events.map((event: DrawEvent) => {
            const homeParticipant = event.participants?.find(
              (p: Participant) => p.type === "home",
            );
            const awayParticipant = event.participants?.find(
              (p: Participant) => p.type === "away",
            );
            const matchStatus = getMatchStatus(event);
            const userBet = userBets[event.eventNumber];
            const newspaperTips = getNewspaperTipsArray(event);

            // Calculate percentages for distribution (with null checks)
            const dist = event.distribution || {
              home: "0",
              draw: "0",
              away: "0",
            };
            const distHome = parseFloat(dist.home) || 0;
            const distDraw = parseFloat(dist.draw) || 0;
            const distAway = parseFloat(dist.away) || 0;
            const distTotal = distHome + distDraw + distAway;

            return (
              <Card
                key={event.eventNumber}
                className={globalStyles.cardCompact}
              >
                {/* Match Header with Badge, League Info, and Date */}
                <div
                  className={globalStyles.flexRowSpaceBetween}
                  style={{
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div className={styles.matchNumber}>{event.eventNumber}</div>
                  <div className={styles.leagueInfo}>
                    {event.league.country.name} - {event.league.name}
                  </div>
                  <div className={styles.leagueInfo}>
                    {new Date(event.sportEventStart).toLocaleString("sv-SE", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {matchStatus.status && (
                    <Badge
                      appearance="tint"
                      color={
                        matchStatus.status === "finished"
                          ? "success"
                          : matchStatus.status === "started"
                            ? "warning"
                            : "informative"
                      }
                      className={styles.statusBadge}
                    >
                      {matchStatus.status === "finished"
                        ? t("rounds.statusFinished")
                        : matchStatus.status === "started"
                          ? t("rounds.statusStarted")
                          : t("rounds.statusNotStarted")}
                    </Badge>
                  )}
                </div>
                {/* Teams and Score */}
                <div className={styles.teams}>
                  <div className={`${styles.teamName} ${styles.homeTeam}`}>
                    {homeParticipant?.name?.replace(/\s*\(\d+\)$/, "") ||
                      t("common.unknown")}
                  </div>
                  <div className={styles.score}>
                    {matchStatus.result ? (
                      matchStatus.result
                    ) : (
                      <span className={styles.scoreSeparator}>-</span>
                    )}
                  </div>
                  <div className={`${styles.teamName} ${styles.awayTeam}`}>
                    {awayParticipant?.name?.replace(/\s*\(\d+\)$/, "") ||
                      t("common.unknown")}
                  </div>
                </div>

                {/* Mitt tips - Shows user's current bets */}
                <div
                  className={styles.userBetRow}
                  style={{
                    marginTop: "12px",
                    marginBottom: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <span className={styles.myBetsLabel}>
                    {t("rounds.myBet")}
                  </span>
                  <div className={styles.betBoxesContainer}>
                    {(() => {
                      return ["1", "x", "2"].map((betType) => (
                        <div
                          key={betType}
                          className={`${styles.betBox} ${
                            userBet?.bets.includes(
                              betType.toUpperCase() as "1" | "X" | "2",
                            )
                              ? styles.betBoxSelected
                              : ""
                          }`}
                          onClick={() =>
                            allMatchesNotStarted &&
                            !userBet?.isFinalized &&
                            !isFinalized
                              ? handleBetChange(
                                  event.eventNumber,
                                  betType.toLowerCase() as "1" | "x" | "2",
                                )
                              : null
                          }
                          style={{
                            opacity:
                              !allMatchesNotStarted ||
                              userBet?.isFinalized ||
                              isFinalized
                                ? 0.6
                                : 1,
                            cursor:
                              allMatchesNotStarted &&
                              !userBet?.isFinalized &&
                              !isFinalized
                                ? "pointer"
                                : "default",
                          }}
                        >
                          {betType}
                        </div>
                      ));
                    })()}
                    <Tooltip
                      content={
                        !allMatchesNotStarted
                          ? t("rounds.tooltipRoundStarted")
                          : userBet && userBet.bets.length >= 2
                            ? t("rounds.tooltipCantHalvgardaSafe")
                            : userBet && userBet.bets.length === 1
                              ? safeMatchNumber === event.eventNumber
                                ? t("rounds.tooltipRemoveSafe")
                                : t("rounds.tooltipSetSafe")
                              : t("rounds.tooltipPlaceBetFirst")
                      }
                      relationship="label"
                    >
                      <ShieldCheckmarkRegular
                        fontSize={20}
                        onClick={() =>
                          allMatchesNotStarted &&
                          userBet &&
                          userBet.bets.length === 1 &&
                          !isFinalized &&
                          handleSafeToggle(event.eventNumber)
                        }
                        style={{
                          cursor:
                            allMatchesNotStarted &&
                            userBet &&
                            userBet.bets.length === 1 &&
                            !isFinalized
                              ? "pointer"
                              : "default",
                          opacity:
                            safeMatchNumber === event.eventNumber ? 1 : 0.3,
                          color: tokens.colorStatusSuccessForeground1,
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* Svenska Spel Info - Table-based */}
                {!userBet?.isFinalized ? (
                  <div className={styles.statsTable}>
                    <div className={styles.tableContainer}>
                      <table className={styles.statsTableElement}>
                        <thead className={styles.tableHeader}>
                          <tr>
                            <th className={styles.tableHeaderCell}></th>
                            <th className={styles.tableHeaderCell}>1</th>
                            <th className={styles.tableHeaderCell}>X</th>
                            <th className={styles.tableHeaderCell}>2</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={styles.tableRow}>
                            <td className={styles.rowLabel}>
                              {t("rounds.odds")}
                            </td>
                            <td className={styles.tableCell}>
                              <span className={styles.cellValue}>
                                {event.odds?.home || "-"}
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              <span className={styles.cellValue}>
                                {event.odds?.draw || "-"}
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              <span className={styles.cellValue}>
                                {event.odds?.away || "-"}
                              </span>
                            </td>
                          </tr>
                          <tr className={styles.tableRow}>
                            <td className={styles.rowLabel}>
                              {t("rounds.publicVote")}
                            </td>
                            <td className={styles.tableCell}>
                              <span className={styles.cellValue}>
                                {distTotal > 0
                                  ? ((distHome / distTotal) * 100).toFixed(0)
                                  : "0"}
                                %
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              <span className={styles.cellValue}>
                                {distTotal > 0
                                  ? ((distDraw / distTotal) * 100).toFixed(0)
                                  : "0"}
                                %
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              <span className={styles.cellValue}>
                                {distTotal > 0
                                  ? ((distAway / distTotal) * 100).toFixed(0)
                                  : "0"}
                                %
                              </span>
                            </td>
                          </tr>
                          {newspaperTips.length > 0 &&
                            (() => {
                              const count1 = newspaperTips.filter(
                                (t) => t === "1",
                              ).length;
                              const countX = newspaperTips.filter(
                                (t) => t === "X",
                              ).length;
                              const count2 = newspaperTips.filter(
                                (t) => t === "2",
                              ).length;

                              return (
                                <tr className={styles.tableRow}>
                                  <td className={styles.rowLabel}>
                                    {t("rounds.newspaperTips")}
                                  </td>
                                  <td className={styles.tableCell}>
                                    <span className={styles.cellValue}>
                                      {count1}
                                    </span>
                                  </td>
                                  <td className={styles.tableCell}>
                                    <span className={styles.cellValue}>
                                      {countX}
                                    </span>
                                  </td>
                                  <td className={styles.tableCell}>
                                    <span className={styles.cellValue}>
                                      {count2}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={styles.statsTable}>
                    <div className={styles.tableContainer}>
                      <table className={styles.statsTableElement}>
                        <thead className={styles.tableHeader}>
                          <tr>
                            <th className={styles.tableHeaderCell}>
                              {t("rounds.distribution")}
                            </th>
                            <th className={styles.tableHeaderCell}>1</th>
                            <th className={styles.tableHeaderCell}>X</th>
                            <th className={styles.tableHeaderCell}>2</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            className={`${styles.tableRow} ${styles.expandableRow}`}
                            onClick={() => {
                              const newExpanded = new Set(expandedMatches);
                              if (newExpanded.has(event.eventNumber)) {
                                newExpanded.delete(event.eventNumber);
                              } else {
                                newExpanded.add(event.eventNumber);
                              }
                              setExpandedMatches(newExpanded);
                            }}
                          >
                            <td className={styles.rowLabel}>
                              <div className={styles.expandableRowLabel}>
                                {expandedMatches.has(event.eventNumber) ? (
                                  <ChevronDownRegular fontSize={16} />
                                ) : (
                                  <ChevronRightRegular fontSize={16} />
                                )}
                                <span
                                  style={{
                                    color: tokens.colorBrandForeground1,
                                  }}
                                >
                                  {betFilters[event.eventNumber]
                                    ? t("rounds.filtered", {
                                        bet: betFilters[event.eventNumber]!,
                                      })
                                    : t("rounds.allParticipants")}
                                </span>
                                {betFilters[event.eventNumber] && (
                                  <DismissRegular
                                    fontSize={14}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBetFilters((prev) => ({
                                        ...prev,
                                        [event.eventNumber]: null,
                                      }));
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      marginLeft: "6px",
                                      color: tokens.colorBrandForeground1,
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td
                              className={styles.tableCell}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedMatches);
                                newExpanded.add(event.eventNumber);
                                setExpandedMatches(newExpanded);
                                setBetFilters((prev) => ({
                                  ...prev,
                                  [event.eventNumber]:
                                    prev[event.eventNumber] === "1"
                                      ? null
                                      : "1",
                                }));
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <span
                                className={styles.cellValue}
                                style={{
                                  fontWeight:
                                    betFilters[event.eventNumber] === "1"
                                      ? tokens.fontWeightBold
                                      : undefined,
                                  color:
                                    betFilters[event.eventNumber] === "1"
                                      ? tokens.colorBrandForeground1
                                      : undefined,
                                }}
                              >
                                {distribution[event.eventNumber]?.["1"] || 0}
                              </span>
                            </td>
                            <td
                              className={styles.tableCell}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedMatches);
                                newExpanded.add(event.eventNumber);
                                setExpandedMatches(newExpanded);
                                setBetFilters((prev) => ({
                                  ...prev,
                                  [event.eventNumber]:
                                    prev[event.eventNumber] === "X"
                                      ? null
                                      : "X",
                                }));
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <span
                                className={styles.cellValue}
                                style={{
                                  fontWeight:
                                    betFilters[event.eventNumber] === "X"
                                      ? tokens.fontWeightBold
                                      : undefined,
                                  color:
                                    betFilters[event.eventNumber] === "X"
                                      ? tokens.colorBrandForeground1
                                      : undefined,
                                }}
                              >
                                {distribution[event.eventNumber]?.X || 0}
                              </span>
                            </td>
                            <td
                              className={styles.tableCell}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedMatches);
                                newExpanded.add(event.eventNumber);
                                setExpandedMatches(newExpanded);
                                setBetFilters((prev) => ({
                                  ...prev,
                                  [event.eventNumber]:
                                    prev[event.eventNumber] === "2"
                                      ? null
                                      : "2",
                                }));
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <span
                                className={styles.cellValue}
                                style={{
                                  fontWeight:
                                    betFilters[event.eventNumber] === "2"
                                      ? tokens.fontWeightBold
                                      : undefined,
                                  color:
                                    betFilters[event.eventNumber] === "2"
                                      ? tokens.colorBrandForeground1
                                      : undefined,
                                }}
                              >
                                {distribution[event.eventNumber]?.["2"] || 0}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {expandedMatches.has(event.eventNumber) && (
                      <div className={styles.expandedContent}>
                        <div className={styles.userBetsGrid}>
                          {/* Current user */}
                          {(() => {
                            const activeFilter = betFilters[event.eventNumber];
                            if (!userBet || userBet.bets.length === 0)
                              return null;
                            if (
                              activeFilter &&
                              !userBet.bets.includes(activeFilter)
                            )
                              return null;

                            return (
                              <div className={styles.userBetRow}>
                                <span className={styles.myBetsLabel}>
                                  {t("rounds.myBet")}
                                </span>
                                <div className={styles.betBoxesContainer}>
                                  {safeMatchNumber === event.eventNumber && (
                                    <Tooltip
                                      content={t("common.safeMatch")}
                                      relationship="label"
                                    >
                                      <ShieldCheckmarkRegular
                                        fontSize={20}
                                        style={{
                                          color:
                                            tokens.colorStatusSuccessForeground1,
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                  {["1", "X", "2"].map((betType) => (
                                    <div
                                      key={betType}
                                      className={`${styles.betBox} ${
                                        userBet?.bets.includes(
                                          betType as "1" | "X" | "2",
                                        )
                                          ? styles.betBoxSelected
                                          : ""
                                      }`}
                                    >
                                      {betType}
                                    </div>
                                  ))}
                                  {isFinalized && (
                                    <Tooltip
                                      content={t("common.confirmed")}
                                      relationship="label"
                                    >
                                      <LockClosedRegular
                                        fontSize={18}
                                        style={{
                                          color: tokens.colorNeutralForeground3,
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Other users — sorted A→Z by display name; unresolved names sort last */}
                          {Object.keys(selectedUsersBets)
                            .sort((a, b) => {
                              const nameA =
                                props.userDisplayNames[a] || "\uFFFF";
                              const nameB =
                                props.userDisplayNames[b] || "\uFFFF";
                              const cmp = nameA.localeCompare(
                                nameB,
                                undefined,
                                { sensitivity: "base" },
                              );
                              return cmp !== 0 ? cmp : a.localeCompare(b);
                            })
                            .map((selectedUserId) => {
                              const otherUserBet =
                                selectedUsersBets[selectedUserId]?.[
                                  event.eventNumber
                                ];

                              // Check if other user's bets are finalized
                              const otherUserIsFinalized =
                                otherUserBet?.isFinalized || false;

                              if (
                                !otherUserBet ||
                                otherUserBet.bets.length === 0
                              ) {
                                return null;
                              }

                              // Apply bet filter if active
                              const activeFilter =
                                betFilters[event.eventNumber];
                              if (
                                activeFilter &&
                                !otherUserBet.bets.includes(activeFilter)
                              ) {
                                return null;
                              }

                              return (
                                <div
                                  key={selectedUserId}
                                  className={styles.userBetRow}
                                >
                                  <span className={styles.userName}>
                                    {props.userDisplayNames[selectedUserId] ||
                                      selectedUserId.substring(0, 8)}
                                  </span>
                                  <div className={styles.betBoxesContainer}>
                                    {otherUserBet.isSafe && (
                                      <Tooltip
                                        content={t("common.safeMatch")}
                                        relationship="label"
                                      >
                                        <ShieldCheckmarkRegular
                                          fontSize={20}
                                          style={{
                                            color:
                                              tokens.colorStatusSuccessForeground1,
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                    {["1", "X", "2"].map((betType) => (
                                      <div
                                        key={betType}
                                        className={`${styles.betBox} ${
                                          otherUserBet.bets.includes(
                                            betType as "1" | "X" | "2",
                                          )
                                            ? otherUserIsFinalized
                                              ? styles.betBoxSelected
                                              : styles.betBoxNotFinalized
                                            : ""
                                        }`}
                                      >
                                        {betType}
                                      </div>
                                    ))}
                                    {otherUserIsFinalized && (
                                      <Tooltip
                                        content={t("common.confirmed")}
                                        relationship="label"
                                      >
                                        <LockClosedRegular
                                          fontSize={18}
                                          style={{
                                            color:
                                              tokens.colorNeutralForeground3,
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* Finalize Button — always visible while round is open, disabled when conditions not met */}
      {roundData?.drawInfo?.draw?.drawState?.toLowerCase() === "open" && (
        <div style={{ marginTop: "16px" }}>
          {/* Validation hints */}
          {isFinalized && (
            <Body1
              style={{
                display: "block",
                color: tokens.colorStatusSuccessForeground1,
                marginBottom: "8px",
              }}
            >
              {t("rounds.hintAlreadyConfirmed")}
            </Body1>
          )}
          {!isFinalized &&
            totalMatchCount > 0 &&
            placedBetsCount < totalMatchCount && (
              <Body1
                style={{
                  display: "block",
                  color: tokens.colorStatusDangerForeground1,
                  marginBottom: "8px",
                }}
              >
                {t("rounds.hintMissingBets", {
                  total: totalMatchCount,
                  placed: placedBetsCount,
                })}
              </Body1>
            )}
          {!isFinalized &&
            totalMatchCount > 0 &&
            placedBetsCount === totalMatchCount &&
            halvgarderingCount < MAX_HALVGARDERINGAR && (
              <Body1
                style={{
                  display: "block",
                  color: tokens.colorStatusDangerForeground1,
                  marginBottom: "8px",
                }}
              >
                {t("rounds.hintMissingHalv", {
                  max: MAX_HALVGARDERINGAR,
                  count: halvgarderingCount,
                })}
              </Body1>
            )}
          {!isFinalized &&
            totalMatchCount > 0 &&
            placedBetsCount === totalMatchCount &&
            halvgarderingCount === MAX_HALVGARDERINGAR &&
            safeMatchNumber === null && (
              <Body1
                style={{
                  display: "block",
                  color: tokens.colorStatusDangerForeground1,
                  marginBottom: "8px",
                }}
              >
                {t("rounds.hintMissingSafe")}
              </Body1>
            )}

          {/* The button — disabled with tooltip when validation fails */}
          {canFinalize ? (
            <Button
              appearance="primary"
              style={{ width: "100%" }}
              onClick={() => setShowFinalizeDialog(true)}
            >
              {t("rounds.finalizeButton")}
            </Button>
          ) : (
            <Tooltip
              content={
                isFinalized
                  ? t("rounds.finalizeTooltipAlready")
                  : placedBetsCount < totalMatchCount
                    ? t("rounds.finalizeTooltipMissingBets", {
                        total: totalMatchCount,
                      })
                    : halvgarderingCount < MAX_HALVGARDERINGAR
                      ? t("rounds.finalizeTooltipMissingHalv", {
                          max: MAX_HALVGARDERINGAR,
                        })
                      : t("rounds.finalizeTooltipMissingSafe")
              }
              relationship="description"
            >
              <Button appearance="primary" style={{ width: "100%" }} disabled>
                {t("rounds.finalizeButton")}
              </Button>
            </Tooltip>
          )}

          {/* Confirm dialog */}
          <Dialog open={showFinalizeDialog}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>{t("rounds.finalizeDialogTitle")}</DialogTitle>
                <DialogContent>
                  <Body1 style={{ display: "block", marginBottom: "12px" }}>
                    {t("rounds.finalizeDialogText")}
                  </Body1>
                  <Body1
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: tokens.colorStatusWarningForeground1,
                    }}
                  >
                    {t("rounds.finalizeDialogWarning")}
                  </Body1>
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setShowFinalizeDialog(false)}
                  >
                    {t("rounds.finalizeCancel")}
                  </Button>
                  <Button appearance="primary" onClick={handleFinalizeRound}>
                    {t("rounds.finalizeConfirm")}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>
      )}
    </PageContainer>
  );
}

import {
  Body1,
  Card,
  Select,
  Spinner,
  Subtitle2,
} from "@fluentui/react-components";
import { Trophy24Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { ElimineringenLiveRoundEditor } from "../components/ElimineringenLiveRoundEditor.tsx";
import { ElimineringenStandingsTable } from "../components/ElimineringenStandingsTable.tsx";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StandingsTable } from "../components/StandingsTable";
import { useAppData } from "../contexts/AppDataContext";
import { useLanguage } from "../contexts/LanguageContext";
import { APIManager } from "../services/APIManager";
import { ElimineringenService } from "../services/ElimineringenService";
import {
  ElimineringenStandingsRow,
  LiveRoundMatch,
  LiveScoreOverride,
  RoundMeta,
  WeeklyEliminationEntry,
} from "../types/elimineringen";

export default function Elimineringen() {
  const { baseStats, baseStatsLoading, userDisplayNames } = useAppData();
  const { t } = useLanguage();

  // Page-local state: only round metadata and live-round details.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<RoundMeta[]>([]);
  const [liveRoundNumber, setLiveRoundNumber] = useState<number | null>(null);
  const [selectedRoundNum, setSelectedRoundNum] = useState<number | null>(null);
  const [isLiveRound, setIsLiveRound] = useState(false);
  const [scoreOverrides, setScoreOverrides] = useState<
    Record<number, LiveScoreOverride>
  >({});
  const [noBetUsers, setNoBetUsers] = useState<Set<string>>(new Set());

  // Derive userId set from the global display-name map.
  const activeUserIds = useMemo(
    () => new Set(Object.keys(userDisplayNames)),
    [userDisplayNames],
  );

  const pageHeader = useMemo(
    () => (
      <PageHeader
        icon={<Trophy24Regular fontSize={32} />}
        title={t("elim.title")}
        subtitle={t("elim.subtitle")}
      />
    ),
    [t],
  );

  // Load only round metadata and the live-round bundle.
  // baseStats and userDisplayNames come from the global AppDataContext.
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const year = new Date().getFullYear();
        const roundData = await APIManager.getElimineringenRoundsForYear(year);

        if (!isMounted) return;

        const mappedRounds: RoundMeta[] = (
          roundData as Array<Record<string, unknown>>
        ).map((round) => ({
          spRoundNum: Number(round.SPRoundNum),
          year: Number(round.Year),
          month: Number(round.Month),
          week: Number(round.Week),
          finished: Boolean(round.Finished),
          noRow: String(round.NoRow ?? ""),
        }));

        const sortedRounds = [...mappedRounds].sort(
          (a, b) => b.spRoundNum - a.spRoundNum,
        );
        const latestRound = sortedRounds[0]?.spRoundNum ?? null;

        let live = false;
        let noBetSet = new Set<string>();

        if (latestRound) {
          const bundle =
            await APIManager.getElimineringenLiveRoundBundle(latestRound);
          if (!isMounted) return;

          const drawState =
            bundle.drawInfo?.draw?.drawState?.toString().toLowerCase() ?? "";
          live = drawState !== "finalized" && drawState !== "result";

          const userIds = new Set(Object.keys(userDisplayNames));
          noBetSet = ElimineringenService.detectNoBetUsersForRound(
            userIds,
            (bundle.allBets as unknown[]) || [],
          );
        }

        setRounds(mappedRounds);
        setLiveRoundNumber(latestRound);
        setSelectedRoundNum(latestRound);
        setIsLiveRound(live);
        setNoBetUsers(noBetSet);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("elim.errorLoading"),
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute elimination rows whenever base data, rounds, or overrides change.
  // Uses merged base stats when score overrides are active.
  const rows = useMemo((): ElimineringenStandingsRow[] => {
    if (baseStatsLoading || rounds.length === 0) return [];

    const effectiveStats =
      selectedRoundNum && Object.keys(scoreOverrides).length > 0
        ? ElimineringenService.mergeLiveOverrides(
            baseStats,
            selectedRoundNum,
            scoreOverrides,
          )
        : baseStats;

    const noBetUsersByRound = liveRoundNumber
      ? { [liveRoundNumber]: noBetUsers }
      : {};

    return ElimineringenService.buildEliminationTimeline(
      effectiveStats,
      rounds,
      userDisplayNames,
      noBetUsersByRound,
    ).rows;
  }, [
    baseStats,
    baseStatsLoading,
    rounds,
    userDisplayNames,
    noBetUsers,
    liveRoundNumber,
    scoreOverrides,
    selectedRoundNum,
  ]);

  // Current week: week number of the live/latest round, or fall back to ISO calendar week.
  const currentWeek = useMemo(() => {
    if (liveRoundNumber) {
      const liveRound = rounds.find((r) => r.spRoundNum === liveRoundNumber);
      if (liveRound) return liveRound.week;
    }
    if (rounds.length > 0) {
      return Math.max(...rounds.map((r) => r.week));
    }
    const now = new Date();
    const d = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }, [rounds, liveRoundNumber]);

  // Week-by-week elimination breakdown.
  const weeklyEliminations = useMemo((): WeeklyEliminationEntry[] => {
    if (baseStatsLoading || baseStats.length === 0) return [];
    return ElimineringenService.calculateEliminationsByWeek(
      baseStats,
      currentWeek,
      userDisplayNames,
    );
  }, [baseStats, baseStatsLoading, currentWeek, userDisplayNames]);

  const totalEliminatedCount = useMemo(
    () =>
      ElimineringenService.getTotalEliminatedCount(
        baseStats,
        currentWeek,
        userDisplayNames,
      ),
    [baseStats, currentWeek, userDisplayNames],
  );

  // Derive the editable match list for the selected round from baseStats.
  const matchesForEditor = useMemo((): LiveRoundMatch[] => {
    if (!selectedRoundNum) return [];
    const seen = new Set<number>();
    const result: LiveRoundMatch[] = [];
    for (const stat of baseStats) {
      if (stat.SPRoundNum !== selectedRoundNum) continue;
      if (seen.has(stat.MatchId)) continue;
      seen.add(stat.MatchId);
      result.push({
        matchNumber: stat.MatchNumber,
        homeTeam: stat.HomeTeam,
        awayTeam: stat.AwayTeam,
        goalsHome: stat.GoalsHome ?? null,
        goalsAway: stat.GoalsAway ?? null,
      });
    }
    return result.sort((a, b) => a.matchNumber - b.matchNumber);
  }, [baseStats, selectedRoundNum]);

  const handleRoundChange = (roundNum: number) => {
    setSelectedRoundNum(roundNum);
    setScoreOverrides({});
  };

  const handleScoreOverridesChange = (
    overrides: Record<number, LiveScoreOverride>,
  ) => {
    setScoreOverrides(overrides);
  };

  const sortedRoundsForSelect = useMemo(
    () =>
      [...rounds]
        .filter((r) => r.month >= 2 && r.month < 9)
        .sort((a, b) => b.spRoundNum - a.spRoundNum),
    [rounds],
  );

  if (loading || baseStatsLoading) {
    return (
      <PageContainer header={pageHeader}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Spinner size="extra-large" />
          <Body1>{t("elim.loading")}</Body1>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer header={pageHeader}>
        <Card>
          <Body1>❌ {error}</Body1>
        </Card>
      </PageContainer>
    );
  }

  const defaultConfig = ElimineringenService.getDefaultConfig();

  // Total contestants = all rows (including already eliminated).
  const totalContestants = rows.length;

  // Derive the live round's 1-based index within the competition so we know
  // the correct elimination quota (2 for rounds 1-6 when contestants > 25, else 1).
  const liveRoundIndex = liveRoundNumber
    ? [...rounds]
        .sort((a, b) => a.spRoundNum - b.spRoundNum)
        .findIndex((r) => r.spRoundNum === liveRoundNumber) + 1
    : 0;
  const isEarlyPhase =
    totalContestants > 25 &&
    typeof defaultConfig.latePhaseStartRoundIndex === "number" &&
    liveRoundIndex < defaultConfig.latePhaseStartRoundIndex;
  const liveWeeklyQuota = isEarlyPhase
    ? defaultConfig.earlyWeeklyEliminationCount
    : defaultConfig.lateWeeklyEliminationCount;

  return (
    <PageContainer header={pageHeader}>
      <div style={{ display: "grid", gap: 12 }}>
        {sortedRoundsForSelect.length > 1 && (
          <Select
            value={String(selectedRoundNum ?? "")}
            onChange={(_, data) => handleRoundChange(Number(data.value))}
            aria-label={t("elim.selectRound")}
          >
            {sortedRoundsForSelect.map((r) => (
              <option key={r.spRoundNum} value={r.spRoundNum}>
                {t("elim.roundOption", {
                  week: r.week,
                  roundNum: r.spRoundNum,
                })}
                {r.spRoundNum === liveRoundNumber ? ` ${t("elim.live")}` : ""}
              </option>
            ))}
          </Select>
        )}
        <ElimineringenLiveRoundEditor
          isLiveRound={isLiveRound && selectedRoundNum === liveRoundNumber}
          matches={matchesForEditor}
          overrides={scoreOverrides}
          onOverridesChange={handleScoreOverridesChange}
        />
        <ElimineringenStandingsTable
          rows={rows}
          isLiveRound={isLiveRound}
          noBetUsers={noBetUsers}
          weeklyQuota={liveWeeklyQuota}
          activeMarker={defaultConfig.activeMarker}
          activeUserIds={activeUserIds}
        />
        {weeklyEliminations.length > 0 && (
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Subtitle2>
                {t("elim.history", {
                  eliminated: totalEliminatedCount,
                  total: totalContestants,
                })}
              </Subtitle2>
              {weeklyEliminations.map((entry) => (
                <div key={entry.spRoundNum} style={{ display: "flex", gap: 8 }}>
                  <Body1>
                    <strong>{t("elim.week", { week: entry.week })}</strong>
                  </Body1>
                  <Body1>
                    {entry.eliminatedUserIds
                      .map((id) => userDisplayNames[id] || id)
                      .join(", ")}
                  </Body1>
                </div>
              ))}
            </div>
          </Card>
        )}
        {rows.length === 0 ? (
          <Card>
            <Body1>{t("elim.noData")}</Body1>
          </Card>
        ) : (
          <StandingsTable
            baseStats={baseStats}
            userDisplayNames={userDisplayNames}
            scopeLabel={t("elim.accumulatedStats")}
          />
        )}
      </div>
    </PageContainer>
  );
}

import { Body1, Card, Spinner, Switch } from "@fluentui/react-components";
import { Trophy24Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { RoundFilterPanel } from "../components/RoundFilterPanel";
import { StandingsTable } from "../components/StandingsTable";
import { APIManager } from "../services/APIManager";
import { BaseStat } from "../services/StandingsCalculationService";
import { useGlobalStyles } from "../styles/globalStyles";
import { BackendUser } from "../types/backend";
import { getISOWeek, getSwedishMonthLabel } from "../utils/dateUtils";

export default function Standings() {
  const globalStyles = useGlobalStyles();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [baseStats, setBaseStats] = useState<BaseStat[]>([]);
  const [userDisplayNames, setUserDisplayNames] = useState<
    Record<string, string>
  >({});
  const isMounted = useRef(true);
  const { scope } = useParams<{ scope: string }>();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based

  // ── Filter scope state (only used when scope === "filter") ───────────────
  const [selectedRounds, setSelectedRounds] = useState<Set<number>>(new Set());
  const [filterStats, setFilterStats] = useState<BaseStat[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (filterLoading || selectedRounds.size === 0) return;
    setFilterLoading(true);
    setFilterError(null);
    try {
      const rounds = Array.from(selectedRounds);
      const stats: BaseStat[] = await APIManager.getBaseStats(rounds);
      if (!isMounted.current) return;
      setFilterStats(stats);
    } catch (err) {
      if (!isMounted.current) return;
      setFilterError(
        err instanceof Error ? err.message : "Fel vid hämtning av ställning",
      );
    } finally {
      if (isMounted.current) setFilterLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedRounds(new Set());
    setFilterStats(null);
    setFilterError(null);
  };

  const { filteredStats, scopeLabel } = useMemo(() => {
    if (scope === "filter") {
      return {
        filteredStats: null as BaseStat[] | null,
        scopeLabel: "Filtrerad",
      };
    }
    if (scope === "month") {
      return {
        filteredStats: baseStats.filter((s) => s.Month === currentMonth),
        scopeLabel: getSwedishMonthLabel(currentMonth, currentYear),
      };
    }
    if (scope === "week") {
      const currentISOWeek = getISOWeek(new Date());
      return {
        filteredStats: baseStats.filter((s) => s.Week === currentISOWeek),
        scopeLabel: `Vecka ${currentISOWeek} \u2013 ${currentYear}`,
      };
    }
    return {
      filteredStats: baseStats,
      scopeLabel: `Totalen ${currentYear}`,
    };
  }, [baseStats, scope, currentMonth, currentYear]);

  useEffect(() => {
    isMounted.current = true;
    const fetchAll = async () => {
      try {
        const [baseStatsData, usersData] = await Promise.all([
          APIManager.getBaseStatsForYear(new Date().getFullYear()),
          APIManager.getAllActiveUsers().catch(() => [] as BackendUser[]),
        ]);
        if (!isMounted.current) return;
        setBaseStats(baseStatsData);
        const displayNames: Record<string, string> = {};
        (usersData as BackendUser[]).forEach((user) => {
          const uid = (user.UserId || user.userId || "")
            .toString()
            .toUpperCase();
          const name = user.UserName || user.userName || "";
          if (uid) displayNames[uid] = name;
        });
        setUserDisplayNames(displayNames);
        setLoading(false);
      } catch (err) {
        if (!isMounted.current) return;
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
        setLoading(false);
      }
    };
    fetchAll();
    return () => {
      isMounted.current = false;
    };
  }, []);
  const pageHeader = (
    <PageHeader
      icon={<Trophy24Regular fontSize={32} />}
      title="Ställningar"
      subtitle={scopeLabel}
      actions={
        !loading && !error ? (
          <Switch
            label="Detaljerat"
            checked={isAdvanced}
            onChange={(_e, data) => setIsAdvanced(data.checked)}
          />
        ) : undefined
      }
      stats={
        loading || error
          ? undefined
          : [
              {
                label: "Spelare",
                value: filteredStats?.length || 0,
                color: "informative" as const,
              },
            ]
      }
    />
  );

  if (loading) {
    return (
      <PageContainer header={pageHeader}>
        <div className={globalStyles.loadingContainer}>
          <Spinner size="extra-large" />
          <Body1>Laddar ställningar...</Body1>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer header={pageHeader}>
        <Card>
          <div className={globalStyles.emptyState}>
            <Body1>❌ {error}</Body1>
          </div>
        </Card>
      </PageContainer>
    );
  }
  return (
    <PageContainer header={pageHeader} fullWidth={isAdvanced}>
      {scope === "filter" ? (
        <>
          <RoundFilterPanel
            selectedRounds={selectedRounds}
            onSelectionChange={setSelectedRounds}
            onConfirm={handleConfirm}
            onClear={handleClear}
            confirming={filterLoading}
          />
          {filterLoading && (
            <div className={globalStyles.loadingContainer}>
              <Spinner size="extra-large" />
              <Body1>Hämtar ställning...</Body1>
            </div>
          )}
          {!filterLoading && filterError && (
            <Card>
              <div className={globalStyles.emptyState}>
                <Body1>❌ {filterError}</Body1>
              </div>
            </Card>
          )}
          {!filterLoading &&
            !filterError &&
            filterStats !== null &&
            filterStats.length === 0 && (
              <Card>
                <div className={globalStyles.emptyState}>
                  <Body1>Inga ställningar tillgängliga ännu</Body1>
                </div>
              </Card>
            )}
          {!filterLoading &&
            !filterError &&
            filterStats !== null &&
            filterStats.length > 0 && (
              <StandingsTable
                baseStats={filterStats}
                advanced={isAdvanced}
                userDisplayNames={userDisplayNames}
                scopeLabel={`Filtrerad: ${selectedRounds.size} omgångar`}
              />
            )}
        </>
      ) : !filteredStats || filteredStats.length === 0 ? (
        <Card>
          <div className={globalStyles.emptyState}>
            <Body1>Inga ställningar tillgängliga ännu</Body1>
          </div>
        </Card>
      ) : (
        <StandingsTable
          baseStats={filteredStats}
          advanced={isAdvanced}
          userDisplayNames={userDisplayNames}
          scopeLabel={scopeLabel}
        />
      )}
    </PageContainer>
  );
}

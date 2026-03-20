import { Body1, Card, Spinner, Switch } from "@fluentui/react-components";
import { Trophy24Regular } from "@fluentui/react-icons";
import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { RoundFilterPanel } from "../components/RoundFilterPanel";
import { StandingsTable } from "../components/StandingsTable";
import { useAppData } from "../contexts/AppDataContext";
import { useLanguage } from "../contexts/LanguageContext";
import { APIManager } from "../services/APIManager";
import { BaseStat } from "../services/StandingsCalculationService";
import { useGlobalStyles } from "../styles/globalStyles";
import { getISOWeek, getSwedishMonthLabel } from "../utils/dateUtils";

export default function Standings() {
  const globalStyles = useGlobalStyles();
  const { baseStats, baseStatsLoading, userDisplayNames } = useAppData();
  const { t } = useLanguage();
  const [error] = useState<string | null>(null);
  const [isAdvanced, setIsAdvanced] = useState(false);
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
      setFilterError(err instanceof Error ? err.message : t("standings.error"));
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
        scopeLabel: t("standings.scopeFiltered"),
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
        scopeLabel: t("standings.scopeWeek", {
          week: currentISOWeek,
          year: currentYear,
        }),
      };
    }
    return {
      filteredStats: baseStats,
      scopeLabel: t("standings.scopeYear", { year: currentYear }),
    };
  }, [baseStats, scope, currentMonth, currentYear]);

  const loading = baseStatsLoading;

  const pageHeader = (
    <PageHeader
      icon={<Trophy24Regular fontSize={32} />}
      title={t("standings.title")}
      subtitle={scopeLabel}
      actions={
        !loading && !error ? (
          <Switch
            label={t("standings.detailed")}
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
                label: t("standings.player"),
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
          <Body1>{t("standings.loading")}</Body1>
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
              <Body1>{t("standings.loadingFilter")}</Body1>
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
                  <Body1>{t("standings.noData")}</Body1>
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
                scopeLabel={t("standings.scopeFilteredRounds", {
                  count: selectedRounds.size,
                })}
              />
            )}
        </>
      ) : !filteredStats || filteredStats.length === 0 ? (
        <Card>
          <div className={globalStyles.emptyState}>
            <Body1>{t("standings.noData")}</Body1>
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

import { Body1, Card, makeStyles, Spinner } from "@fluentui/react-components";
import { Trophy24Regular } from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StandingsTable } from "../components/StandingsTable";
import { APIManager } from "../services/APIManager";
import { BaseStat } from "../services/StandingsCalculationService";
import { useGlobalStyles } from "../styles/globalStyles";
import { BackendUser } from "../types/backend";

// No local styles needed - all moved to global
const useStyles = makeStyles({});

export default function Standings() {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseStats, setBaseStats] = useState<BaseStat[]>([]);
  const [userDisplayNames, setUserDisplayNames] = useState<
    Record<string, string>
  >({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchAll = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const [baseStatsData, usersData] = await Promise.all([
          APIManager.getBaseStatsForYear(currentYear),
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
  if (loading) {
    return (
      <PageContainer fullWidth>
        <PageHeader
          icon={<Trophy24Regular fontSize={32} />}
          title="Ställningar"
          subtitle="Aktuell ställning i tävlingen"
        />
        <div className={globalStyles.loadingContainer}>
          <Spinner size="extra-large" />
          <Body1>Laddar ställningar...</Body1>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer fullWidth>
        <PageHeader
          icon={<Trophy24Regular fontSize={32} />}
          title="Ställningar"
          subtitle="Aktuell ställning i tävlingen"
        />
        <Card>
          <div className={globalStyles.emptyState}>
            <Body1>❌ {error}</Body1>
          </div>
        </Card>
      </PageContainer>
    );
  }
  return (
    <PageContainer fullWidth>
      <PageHeader
        icon={<Trophy24Regular fontSize={32} />}
        title="Ställningar"
        subtitle="Aktuell ställning i tävlingen"
        stats={[
          {
            label: "Spelare",
            value: baseStats?.length || 0,
            color: "informative",
          },
        ]}
      />

      {!baseStats || baseStats.length === 0 ? (
        <Card>
          <div className={globalStyles.emptyState}>
            <Body1>Inga ställningar tillgängliga ännu</Body1>
          </div>
        </Card>
      ) : (
        <StandingsTable
          baseStats={baseStats}
          showToggle={true}
          defaultAdvanced={false}
          userDisplayNames={userDisplayNames}
        />
      )}
    </PageContainer>
  );
}

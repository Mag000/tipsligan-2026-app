import { Body1, Card, makeStyles, Spinner } from "@fluentui/react-components";
import { Trophy24Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StandingsTable } from "../components/StandingsTable";
import { APIManager } from "../services/APIManager";
import { useGlobalStyles } from "../styles/globalStyles";

// No local styles needed - all moved to global
const useStyles = makeStyles({});

export default function Standings() {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseStats, setBaseStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const baseStatsData = await APIManager.getBaseStatsForYear(currentYear);
        setBaseStats(baseStatsData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
        setLoading(false);
      }
    };
    fetchStats();
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
        />
      )}
    </PageContainer>
  );
}

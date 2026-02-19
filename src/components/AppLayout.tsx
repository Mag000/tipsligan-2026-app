import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const useStyles = makeStyles({
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  header: {
    position: "sticky",
    top: 0,
    backgroundColor: tokens.colorBrandBackground2,
    zIndex: 1000,
    ...shorthands.padding("16px", "20px"),
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    ...shorthands.borderBottom("2px", "solid", tokens.colorBrandStroke1),
  },
  headerContent: {
    maxWidth: "1200px",
    ...shorthands.margin("0", "auto"),
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("16px"),
    flexWrap: "wrap",
  },
  roundDropdown: {
    minWidth: "200px",
  },
  content: {
    flex: 1,
  },
});

interface Round {
  id?: number;
  SPRoundNum: number;
  Year: number;
  Week: number;
  Month?: number;
  Comment?: string;
  Finished?: boolean;
}

interface AppLayoutProps {
  children: React.ReactNode;
  availableRounds: Round[];
  currentRound: number | null;
  setCurrentRound: (round: number) => void;
}

export function AppLayout({
  children,
  availableRounds,
  currentRound,
  setCurrentRound,
}: AppLayoutProps) {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show round selector on /rounds routes
  const showRoundSelector = location.pathname.startsWith("/rounds");

  console.log("AppLayout:", {
    pathname: location.pathname,
    showRoundSelector,
    currentRound,
    availableRoundsCount: availableRounds.length,
  });

  const roundOptions = useMemo(() => {
    return availableRounds.map((round) => ({
      key: String(round.SPRoundNum),
      text: `${round.Year} - Vecka ${round.Week}`,
      value: round.SPRoundNum,
    }));
  }, [availableRounds]);

  const handleRoundSelect = (_: any, data: any) => {
    const selectedRound = parseInt(data.optionValue, 10);
    if (selectedRound) {
      setCurrentRound(selectedRound);
      navigate(`/rounds/${selectedRound}`);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Round selector moved to Round page title */}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

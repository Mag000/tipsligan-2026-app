import {
  Badge,
  Body1,
  Card,
  CardHeader,
  Input,
  Label,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { useEffect, useMemo, useState } from "react";
import { LiveRoundMatch, LiveScoreOverride } from "../types/elimineringen";

const useStyles = makeStyles({
  container: {
    display: "grid",
    ...shorthands.gap("12px"),
  },
  header: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  note: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "2fr 120px 120px",
    alignItems: "center",
    ...shorthands.gap("10px"),
  },
  teams: {
    fontWeight: tokens.fontWeightSemibold,
  },
  scoreGroup: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  scoreInput: {
    width: "72px",
  },
});

interface ElimineringenLiveRoundEditorProps {
  isLiveRound: boolean;
  matches: LiveRoundMatch[];
  overrides: Record<number, LiveScoreOverride>;
  onOverridesChange: (overrides: Record<number, LiveScoreOverride>) => void;
}

export function ElimineringenLiveRoundEditor({
  isLiveRound,
  matches,
  overrides,
  onOverridesChange,
}: ElimineringenLiveRoundEditorProps) {
  const styles = useStyles();
  const [drafts, setDrafts] = useState<
    Record<number, { home: string; away: string }>
  >({});

  useEffect(() => {
    const initialDrafts: Record<number, { home: string; away: string }> = {};
    for (const match of matches) {
      const override = overrides[match.matchNumber];
      initialDrafts[match.matchNumber] = {
        home: String(override?.goalsHome ?? match.goalsHome ?? ""),
        away: String(override?.goalsAway ?? match.goalsAway ?? ""),
      };
    }
    setDrafts(initialDrafts);
  }, [matches, overrides]);

  const sortedMatches = useMemo(
    () =>
      [...matches].sort(
        (first, second) => first.matchNumber - second.matchNumber,
      ),
    [matches],
  );

  const updateScore = (
    matchNumber: number,
    side: "home" | "away",
    value: string,
  ) => {
    const nextDraft = {
      ...(drafts[matchNumber] ?? { home: "", away: "" }),
      [side]: value,
    };

    const nextDrafts = {
      ...drafts,
      [matchNumber]: nextDraft,
    };
    setDrafts(nextDrafts);

    const home = Number(nextDraft.home);
    const away = Number(nextDraft.away);
    const hasHome = nextDraft.home.trim().length > 0 && Number.isFinite(home);
    const hasAway = nextDraft.away.trim().length > 0 && Number.isFinite(away);

    const nextOverrides = { ...overrides };
    if (hasHome && hasAway) {
      nextOverrides[matchNumber] = {
        matchNumber,
        goalsHome: home,
        goalsAway: away,
      };
    } else {
      delete nextOverrides[matchNumber];
    }

    onOverridesChange(nextOverrides);
  };

  if (sortedMatches.length === 0) {
    return (
      <Card>
        <Body1>Inga matcher hittades för vald omgång.</Body1>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        header={
          <div className={styles.header}>
            <span>Målresultat</span>
            {isLiveRound && (
              <Badge appearance="filled" color="warning" size="small">
                Live
              </Badge>
            )}
          </div>
        }
        description={
          <span className={styles.note}>
            Ändringar påverkar bara den lokala beräkningen, inte databasen.
          </span>
        }
      />
      <div className={styles.container}>
        {sortedMatches.map((match) => {
          const draft = drafts[match.matchNumber] ?? { home: "", away: "" };
          return (
            <div key={match.matchNumber} className={styles.row}>
              <div className={styles.teams}>
                {match.matchNumber}. {match.homeTeam} - {match.awayTeam}
              </div>
              <div className={styles.scoreGroup}>
                <Label htmlFor={`match-${match.matchNumber}-home`}>H</Label>
                <Input
                  id={`match-${match.matchNumber}-home`}
                  className={styles.scoreInput}
                  type="number"
                  value={draft.home}
                  onChange={(_, data) =>
                    updateScore(match.matchNumber, "home", data.value)
                  }
                />
              </div>
              <div className={styles.scoreGroup}>
                <Label htmlFor={`match-${match.matchNumber}-away`}>B</Label>
                <Input
                  id={`match-${match.matchNumber}-away`}
                  className={styles.scoreInput}
                  type="number"
                  value={draft.away}
                  onChange={(_, data) =>
                    updateScore(match.matchNumber, "away", data.value)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

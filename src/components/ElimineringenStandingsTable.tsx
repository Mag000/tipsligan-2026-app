import {
  Body1,
  Card,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { ElimineringenService } from "../services/ElimineringenService";
import { ElimineringenStandingsRow } from "../types/elimineringen";

const useStyles = makeStyles({
  table: {
    width: "100%",
    display: "grid",
    ...shorthands.gap("0"),
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "64px 1.6fr 96px 120px 140px 120px",
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    "& > div": {
      ...shorthands.padding("10px", "12px"),
      whiteSpace: "nowrap",
    },
  },
  row: {
    display: "grid",
    gridTemplateColumns: "64px 1.6fr 96px 120px 140px 120px",
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    "& > div": {
      ...shorthands.padding("10px", "12px"),
    },
  },
  rowEliminated: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
  rowWinner: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  numberCell: {
    textAlign: "right",
  },
  statusCell: {
    fontWeight: tokens.fontWeightSemibold,
  },
  marker: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightBold,
    ...shorthands.padding("0", "0", "0", "6px"),
  },
});

interface ElimineringenStandingsTableProps {
  rows: ElimineringenStandingsRow[];
  isLiveRound: boolean;
  noBetUsers: Set<string>;
  weeklyQuota: number;
  activeMarker: string;
  activeUserIds: Set<string>;
}

export function ElimineringenStandingsTable({
  rows,
  isLiveRound,
  noBetUsers,
  weeklyQuota,
  activeMarker,
  activeUserIds,
}: ElimineringenStandingsTableProps) {
  const styles = useStyles();

  if (rows.length === 0) {
    return (
      <Card>
        <Body1>Ingen tabell att visa ännu.</Body1>
      </Card>
    );
  }

  const sortedRows = [...rows].sort((first, second) => {
    const firstEliminated = first.status === "eliminated";
    const secondEliminated = second.status === "eliminated";

    if (firstEliminated && !secondEliminated) {
      return 1;
    }

    if (!firstEliminated && secondEliminated) {
      return -1;
    }

    if (firstEliminated && secondEliminated) {
      return (
        (first.eliminationSequence ?? 9999) -
        (second.eliminationSequence ?? 9999)
      );
    }

    return first.position - second.position;
  });

  const liveState = ElimineringenService.computeLiveEliminationPositions(
    rows,
    isLiveRound,
    weeklyQuota,
    noBetUsers,
  );

  return (
    <Card>
      <div
        className={styles.table}
        role="table"
        aria-label="Elimineringen-tabell"
      >
        <div className={styles.headerRow} role="row">
          <div role="columnheader">Plats</div>
          <div role="columnheader">Spelare</div>
          <div role="columnheader" className={styles.numberCell}>
            Rätt
          </div>
          <div role="columnheader" className={styles.numberCell}>
            Rätt säkra
          </div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Vecka</div>
        </div>
        {sortedRows.map((row) => {
          const userId = row.userId.toUpperCase();
          const isActive =
            activeUserIds.has(userId) && row.status !== "eliminated";
          const showLiveMarker =
            isLiveRound &&
            isActive &&
            liveState.eliminationPositionUserIds.has(userId);

          return (
            <div
              key={row.userId}
              className={`${styles.row} ${
                row.status === "eliminated"
                  ? styles.rowEliminated
                  : row.status === "winner"
                    ? styles.rowWinner
                    : ""
              }`}
              role="row"
            >
              <div role="cell">{row.position}</div>
              <div role="cell">
                {row.displayName}
                {row.status === "eliminated" &&
                  row.eliminationReason === "no-bet" && (
                    <span
                      className={styles.marker}
                      aria-label="Lämnade ingen rad denna omgång"
                      title="Lämnade ingen rad denna omgång"
                    >
                      *
                    </span>
                  )}
                {showLiveMarker && (
                  <span
                    className={styles.marker}
                    aria-label="I eliminationszon just nu"
                    title="I eliminationszon just nu"
                  >
                    {activeMarker}
                  </span>
                )}
              </div>
              <div role="cell" className={styles.numberCell}>
                {row.correctCount}
              </div>
              <div role="cell" className={styles.numberCell}>
                {row.correctSafeCount}
              </div>
              <div role="cell" className={styles.statusCell}>
                {row.status === "winner"
                  ? "Vinnare"
                  : row.status === "eliminated"
                    ? "Utslagen"
                    : "Aktiv"}
              </div>
              <div role="cell">
                {row.eliminatedWeek != null ? `v. ${row.eliminatedWeek}` : "-"}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

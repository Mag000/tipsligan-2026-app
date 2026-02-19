import {
  Button,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ChevronDown20Regular,
  ChevronUp20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import {
  StandingsCalculationService,
  StandingsCounter,
} from "../services/StandingsCalculationService";

const useStyles = makeStyles({
  tableContainer: {
    width: "100%",
  },
  table: {
    width: "100%",
  },
  tableAdvancedWidth: {
    width: "auto",
    minWidth: "100%",
  },
  tableHeader: {
    display: "grid",
    ...shorthands.padding("0"),
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    ...shorthands.borderBottom("2px", "solid", tokens.colorNeutralStroke2),
    whiteSpace: "nowrap",
    ...shorthands.gap("0"),
    position: "sticky",
    top: "0",
    zIndex: 10,
    "& > div": {
      ...shorthands.padding("8px", "12px"),
      ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
      ":last-child": {
        borderRight: "none",
      },
    },
  },
  tableHeaderBasic: {
    gridTemplateColumns: "60px 1fr 100px 100px",
    maxWidth: "700px",
    margin: "0 auto",
  },
  tableHeaderAdvanced: {
    gridTemplateColumns:
      "60px minmax(120px, 150px) 80px 80px repeat(18, minmax(60px, 80px))",
    fontSize: "10px",
  },
  mainGroupHeader: {
    gridColumn: "span 9",
    textAlign: "center",
    fontWeight: tokens.fontWeightBold,
    fontSize: "12px",
    ...shorthands.padding("10px", "0"),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ...shorthands.borderBottom("2px", "solid", tokens.colorBrandStroke1),
    ...shorthands.borderRight("1px", "solid", tokens.colorBrandStroke1),
  },
  subGroupHeader: {
    gridColumn: "span 3",
    textAlign: "center",
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "10px",
    ...shorthands.padding("8px", "0"),
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground2,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
  },
  columnHeader: {
    textAlign: "right",
    fontSize: "9px",
    ...shorthands.padding("6px", "8px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
  },
  basicStatHeader: {
    textAlign: "right",
    display: "flex",
    alignItems: "flex-end",
    ...shorthands.padding("0", "12px", "6px", "12px"),
    fontSize: "9px",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  tableRow: {
    display: "grid",
    ...shorthands.padding("0"),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    ":last-child": {
      borderBottom: "none",
    },
    ":nth-child(even)": {
      backgroundColor: tokens.colorNeutralBackground4,
    },
    whiteSpace: "nowrap",
    "& > div": {
      ...shorthands.padding("12px", "12px"),
      ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
      ":last-child": {
        borderRight: "none",
      },
    },
  },
  tableRowThickBorder: {
    ...shorthands.borderBottom("4px", "solid", tokens.colorNeutralForeground3),
  },
  tableRowBeforeLast: {
    ...shorthands.borderBottom("4px", "solid", tokens.colorBrandStroke2),
  },
  tableRowBasic: {
    gridTemplateColumns: "60px 1fr 100px 100px",
    maxWidth: "700px",
    margin: "0 auto",
  },
  tableRowAdvanced: {
    gridTemplateColumns:
      "60px minmax(120px, 150px) 80px 80px repeat(18, minmax(60px, 80px))",
    fontSize: "12px",
  },
  rank: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    position: "sticky",
    left: "0",
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 5,
  },
  rankTop3: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
  },
  playerName: {
    position: "sticky",
    left: "60px",
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 5,
  },
  playerNameEven: {
    backgroundColor: tokens.colorNeutralBackground4,
  },
  stat: {
    textAlign: "right",
    color: tokens.colorNeutralForeground2,
    whiteSpace: "nowrap",
  },
  statSmall: {
    textAlign: "right",
    color: tokens.colorNeutralForeground2,
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  toggleButton: {
    marginBottom: "16px",
  },
});

interface StandingsTableProps {
  baseStats: any[];
  showToggle?: boolean;
  defaultAdvanced?: boolean;
}

export function StandingsTable({
  baseStats,
  showToggle = true,
  defaultAdvanced = false,
}: StandingsTableProps) {
  const styles = useStyles();
  const [showAdvanced, setShowAdvanced] = useState(defaultAdvanced);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  // Helper function to calculate percentage
  const calcPercent = (hits: number, bets: number): string => {
    if (bets === 0) return "0%";
    return `${Math.round((hits / bets) * 100)}%`;
  };

  // Calculate standings from baseStats
  const standings: StandingsCounter[] =
    StandingsCalculationService.calculateStandings(
      baseStats,
      StandingsCalculationService.shouldUseNewRanking()
    );

  if (standings.length === 0) {
    return null;
  }

  return (
    <>
      {showToggle && (
        <Button
          className={styles.toggleButton}
          icon={
            showAdvanced ? <ChevronUp20Regular /> : <ChevronDown20Regular />
          }
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Visa enkel vy" : "Visa avancerad statistik"}
        </Button>
      )}

      <div
        className={styles.tableContainer}
        style={{
          maxWidth: showAdvanced ? "none" : "700px",
          margin: showAdvanced ? "0" : "0 auto",
          overflowX: showAdvanced ? "auto" : "visible",
          overflowY: showAdvanced ? "auto" : "visible",
          maxHeight: showAdvanced ? "calc(100vh - 250px)" : "none",
          backgroundColor: showAdvanced
            ? tokens.colorNeutralBackground1
            : "transparent",
          borderRadius: showAdvanced ? tokens.borderRadiusMedium : "0",
          boxShadow: showAdvanced ? tokens.shadow4 : "none",
          border: showAdvanced
            ? `1px solid ${tokens.colorNeutralStroke2}`
            : "none",
        }}
      >
        <div
          className={`${styles.table} ${
            showAdvanced ? styles.tableAdvancedWidth : ""
          }`}
        >
          <div
            className={`${styles.tableHeader} ${
              showAdvanced
                ? styles.tableHeaderAdvanced
                : styles.tableHeaderBasic
            }`}
          >
            {/* First four columns span all three rows in advanced mode */}
            <div
              style={{
                gridRow: showAdvanced ? "1 / 4" : "1",
                position: "sticky",
                left: "0",
                backgroundColor:
                  showAdvanced && hoveredColumn === 0
                    ? "rgba(0, 120, 212, 0.15)"
                    : tokens.colorNeutralBackground3,
                zIndex: 11,
              }}
              onMouseEnter={
                showAdvanced ? () => setHoveredColumn(0) : undefined
              }
              onMouseLeave={
                showAdvanced ? () => setHoveredColumn(null) : undefined
              }
            >
              {/* Empty - no header for Plats */}
            </div>
            <div
              style={{
                gridRow: showAdvanced ? "1 / 4" : "1",
                position: "sticky",
                left: "60px",
                backgroundColor:
                  showAdvanced && hoveredColumn === 1
                    ? "rgba(0, 120, 212, 0.15)"
                    : tokens.colorNeutralBackground3,
                zIndex: 11,
              }}
              onMouseEnter={
                showAdvanced ? () => setHoveredColumn(1) : undefined
              }
              onMouseLeave={
                showAdvanced ? () => setHoveredColumn(null) : undefined
              }
            >
              {/* Empty - no header for Spelare */}
            </div>
            <div
              style={{
                gridRow: showAdvanced ? "1 / 4" : "1",
                backgroundColor:
                  showAdvanced && hoveredColumn === 2
                    ? "rgba(0, 120, 212, 0.15)"
                    : undefined,
              }}
              className={showAdvanced ? styles.basicStatHeader : ""}
              onMouseEnter={
                showAdvanced ? () => setHoveredColumn(2) : undefined
              }
              onMouseLeave={
                showAdvanced ? () => setHoveredColumn(null) : undefined
              }
            >
              <span style={{ width: "100%", textAlign: "right" }}>
                Antal rätt
              </span>
            </div>
            <div
              style={{
                gridRow: showAdvanced ? "1 / 4" : "1",
                backgroundColor:
                  showAdvanced && hoveredColumn === 3
                    ? "rgba(0, 120, 212, 0.15)"
                    : undefined,
              }}
              className={showAdvanced ? styles.basicStatHeader : ""}
              onMouseEnter={
                showAdvanced ? () => setHoveredColumn(3) : undefined
              }
              onMouseLeave={
                showAdvanced ? () => setHoveredColumn(null) : undefined
              }
            >
              <span style={{ width: "100%", textAlign: "right" }}>
                Träffade säkra
              </span>
            </div>
            {showAdvanced && (
              <>
                {/* Row 1 - Main group headers */}
                <div className={styles.mainGroupHeader}>Singeltecken</div>
                <div className={styles.mainGroupHeader}>Garderingar</div>

                {/* Row 2 - Sub group headers */}
                <div className={styles.subGroupHeader}>Ettor</div>
                <div className={styles.subGroupHeader}>Kryss</div>
                <div className={styles.subGroupHeader}>Tvåor</div>
                <div className={styles.subGroupHeader}>1X</div>
                <div className={styles.subGroupHeader}>X2</div>
                <div className={styles.subGroupHeader}>12</div>

                {/* Row 3 - Column headers */}
                {[
                  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                  21,
                ].map((colIndex) => {
                  const labels = ["Spelade", "Träffade", "%"];
                  const label = labels[colIndex % 3];
                  return (
                    <div
                      key={colIndex}
                      className={styles.columnHeader}
                      onMouseEnter={() => setHoveredColumn(colIndex)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === colIndex
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {standings.map((player, index) => {
            const isAfter3rd = player.position === 3;
            const isAfter10th = player.position === 10;
            const isAfter20th = player.position === 20;
            const isBeforeLast = player.position === standings.length - 1;
            const isEvenRow = index % 2 === 1;
            const isRowHovered = hoveredRow === index;

            const thickBorderClass =
              isAfter3rd || isAfter10th || isAfter20th
                ? styles.tableRowThickBorder
                : isBeforeLast
                ? styles.tableRowBeforeLast
                : "";

            return (
              <div
                key={player.position}
                className={`${styles.tableRow} ${
                  showAdvanced ? styles.tableRowAdvanced : styles.tableRowBasic
                } ${thickBorderClass}`}
                onMouseEnter={
                  showAdvanced ? () => setHoveredRow(index) : undefined
                }
                onMouseLeave={
                  showAdvanced ? () => setHoveredRow(null) : undefined
                }
                style={{
                  backgroundColor:
                    showAdvanced && isRowHovered
                      ? "rgba(0, 120, 212, 0.15)"
                      : undefined,
                }}
              >
                <div
                  className={`${styles.rank} ${
                    player.position <= 3 ? styles.rankTop3 : ""
                  } ${isEvenRow ? styles.playerNameEven : ""}`}
                  onMouseEnter={
                    showAdvanced ? () => setHoveredColumn(0) : undefined
                  }
                  onMouseLeave={
                    showAdvanced ? () => setHoveredColumn(null) : undefined
                  }
                  style={{
                    backgroundColor:
                      showAdvanced && hoveredColumn === 0
                        ? "rgba(0, 120, 212, 0.15)"
                        : undefined,
                  }}
                >
                  {player.position === 1 && "🥇 "}
                  {player.position === 2 && "🥈 "}
                  {player.position === 3 && "🥉 "}
                  {player.position}
                </div>
                <div
                  className={`${styles.playerName} ${
                    isEvenRow ? styles.playerNameEven : ""
                  }`}
                  onMouseEnter={
                    showAdvanced ? () => setHoveredColumn(1) : undefined
                  }
                  onMouseLeave={
                    showAdvanced ? () => setHoveredColumn(null) : undefined
                  }
                  style={{
                    backgroundColor:
                      showAdvanced && hoveredColumn === 1
                        ? "rgba(0, 120, 212, 0.15)"
                        : undefined,
                  }}
                >
                  {player.userName}
                </div>
                <div
                  className={showAdvanced ? styles.statSmall : styles.stat}
                  onMouseEnter={
                    showAdvanced ? () => setHoveredColumn(2) : undefined
                  }
                  onMouseLeave={
                    showAdvanced ? () => setHoveredColumn(null) : undefined
                  }
                  style={{
                    backgroundColor:
                      showAdvanced && hoveredColumn === 2
                        ? "rgba(0, 120, 212, 0.15)"
                        : undefined,
                  }}
                >
                  {player.correctCount}
                </div>
                <div
                  className={showAdvanced ? styles.statSmall : styles.stat}
                  onMouseEnter={
                    showAdvanced ? () => setHoveredColumn(3) : undefined
                  }
                  onMouseLeave={
                    showAdvanced ? () => setHoveredColumn(null) : undefined
                  }
                  style={{
                    backgroundColor:
                      showAdvanced && hoveredColumn === 3
                        ? "rgba(0, 120, 212, 0.15)"
                        : undefined,
                  }}
                >
                  {player.correctSafeCount}
                </div>

                {showAdvanced && (
                  <>
                    {/* Ettor */}
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(4)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 4
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.single1Bets}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(5)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 5
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.single1Hits}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(6)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 6
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {calcPercent(player.single1Hits, player.single1Bets)}
                    </div>
                    {/* Kryss */}
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(7)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 7
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.singleXBets}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(8)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 8
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.singleXHits}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(9)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 9
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {calcPercent(player.singleXHits, player.singleXBets)}
                    </div>
                    {/* Tvåor */}
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(10)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 10
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.single2Bets}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(11)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 11
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.single2Hits}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(12)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 12
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {calcPercent(player.single2Hits, player.single2Bets)}
                    </div>
                    {/* 1X Gardering */}
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(13)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 13
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.hedge1XBets}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(14)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 14
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.hedge1XHits}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(15)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 15
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {calcPercent(player.hedge1XHits, player.hedge1XBets)}
                    </div>
                    {/* X2 Gardering */}
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(16)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 16
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.hedgeX2Bets}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(17)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 17
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.hedgeX2Hits}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(18)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 18
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {calcPercent(player.hedgeX2Hits, player.hedgeX2Bets)}
                    </div>
                    {/* 12 Gardering */}
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(19)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 19
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.hedge12Bets}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(20)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 20
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {player.hedge12Hits}
                    </div>
                    <div
                      className={styles.statSmall}
                      onMouseEnter={() => setHoveredColumn(21)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{
                        backgroundColor:
                          hoveredColumn === 21
                            ? "rgba(0, 120, 212, 0.15)"
                            : undefined,
                      }}
                    >
                      {calcPercent(player.hedge12Hits, player.hedge12Bets)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

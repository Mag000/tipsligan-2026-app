import {
  Body1,
  Button,
  Checkbox,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular, Filter24Regular } from "@fluentui/react-icons";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { APIManager } from "../services/APIManager";
import { roundSet } from "../types/round";
import { getSwedishMonthLabel } from "../utils/dateUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

type MonthGroup = { month: number; rounds: roundSet[] };
type YearGroup = { year: number; months: MonthGroup[] };

export interface RoundFilterPanelProps {
  selectedRounds: Set<number>; // SPRoundNum values
  onSelectionChange: (rounds: Set<number>) => void;
  onConfirm: () => void; // fires "Visa ställning"
  onClear: () => void; // fires "Rensa val"
  confirming: boolean; // table fetch in progress
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalS} 0`,
    overflowY: "auto",
  },
  yearRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    cursor: "pointer",
    padding: `${tokens.spacingVerticalXS} 0`,
    userSelect: "none",
  },
  monthRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    cursor: "pointer",
    padding: `${tokens.spacingVerticalXS} 0`,
    paddingLeft: tokens.spacingHorizontalL,
    userSelect: "none",
  },
  roundRow: {
    paddingLeft: `calc(${tokens.spacingHorizontalL} * 2)`,
  },
  chevron: {
    fontSize: "10px",
    color: tokens.colorNeutralForeground3,
    minWidth: "12px",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: "wrap",
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
  },
});

// ─── Component ───────────────────────────────────────────────────────────────

export function RoundFilterPanel({
  selectedRounds,
  onSelectionChange,
  onConfirm,
  onClear,
  confirming,
}: RoundFilterPanelProps) {
  const styles = useStyles();
  const isMounted = useRef(true);

  const [allRounds, setAllRounds] = useState<roundSet[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [roundsError, setRoundsError] = useState<string | null>(null);

  // Expand/collapse state keyed by year and "year-month"
  const [isOpen, setIsOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // ── Fetch all rounds once on mount ────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    setLoadingRounds(true);
    APIManager.getAllRounds()
      .then((rounds: roundSet[]) => {
        if (!isMounted.current) return;
        setAllRounds(rounds);
        // Auto-expand the most recent year
        if (rounds.length > 0) {
          const maxYear = Math.max(...rounds.map((r) => r.Year));
          setExpandedYears(new Set([maxYear]));
        }
      })
      .catch((err: unknown) => {
        if (!isMounted.current) return;
        setRoundsError(
          err instanceof Error ? err.message : "Kunde inte ladda omgångar",
        );
      })
      .finally(() => {
        if (isMounted.current) setLoadingRounds(false);
      });
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Build tree structure ──────────────────────────────────────────────────
  const treeData: YearGroup[] = useMemo(() => {
    const map = new Map<number, Map<number, roundSet[]>>();
    allRounds.forEach((r) => {
      if (!map.has(r.Year)) map.set(r.Year, new Map());
      const monthMap = map.get(r.Year)!;
      if (!monthMap.has(r.Month)) monthMap.set(r.Month, []);
      monthMap.get(r.Month)!.push(r);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0]) // newest year first
      .map(([year, monthMap]) => ({
        year,
        months: Array.from(monthMap.entries())
          .sort((a, b) => b[0] - a[0]) // newest month first
          .map(([month, rounds]) => ({
            month,
            rounds: [...rounds].sort((a, b) => b.SPRoundNum - a.SPRoundNum),
          })),
      }));
  }, [allRounds]);

  // ── Expand/collapse toggles ───────────────────────────────────────────────
  function toggleYear(year: number) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Individual round selection ────────────────────────────────────────────
  function toggleRound(spRoundNum: number) {
    const next = new Set(selectedRounds);
    if (next.has(spRoundNum)) next.delete(spRoundNum);
    else next.add(spRoundNum);
    onSelectionChange(next);
  }

  // ── Month-level selection ─────────────────────────────────────────────────
  function toggleMonthRounds(rounds: roundSet[]) {
    const all = rounds.every((r) => selectedRounds.has(r.SPRoundNum));
    const next = new Set(selectedRounds);
    if (all) {
      rounds.forEach((r) => next.delete(r.SPRoundNum));
    } else {
      rounds.forEach((r) => next.add(r.SPRoundNum));
    }
    onSelectionChange(next);
  }

  // ── Year-level selection ──────────────────────────────────────────────────
  function toggleYearRounds(yearGroup: YearGroup) {
    const allRoundsInYear = yearGroup.months.flatMap((m) => m.rounds);
    const all = allRoundsInYear.every((r) => selectedRounds.has(r.SPRoundNum));
    const next = new Set(selectedRounds);
    if (all) {
      allRoundsInYear.forEach((r) => next.delete(r.SPRoundNum));
    } else {
      allRoundsInYear.forEach((r) => next.add(r.SPRoundNum));
    }
    onSelectionChange(next);
  }

  // ── Computed selection state helpers ─────────────────────────────────────
  function monthCheckedState(rounds: roundSet[]): boolean | "mixed" {
    const checkedCount = rounds.filter((r) =>
      selectedRounds.has(r.SPRoundNum),
    ).length;
    if (checkedCount === 0) return false;
    if (checkedCount === rounds.length) return true;
    return "mixed";
  }

  function yearCheckedState(yearGroup: YearGroup): boolean | "mixed" {
    const allRoundsInYear = yearGroup.months.flatMap((m) => m.rounds);
    const checkedCount = allRoundsInYear.filter((r) =>
      selectedRounds.has(r.SPRoundNum),
    ).length;
    if (checkedCount === 0) return false;
    if (checkedCount === allRoundsInYear.length) return true;
    return "mixed";
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  // ── Shared drawer shell for loading/error/empty states ─────────────────
  function DrawerShell({ children }: { children: ReactNode }) {
    return (
      <OverlayDrawer
        position="end"
        size="small"
        open={isOpen}
        onOpenChange={(_, { open: o }) => setIsOpen(o)}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setIsOpen(false)}
                aria-label="Stäng filterpanel"
              />
            }
          >
            Välj omgångar
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.drawerBody}>{children}</div>
        </DrawerBody>
      </OverlayDrawer>
    );
  }

  if (loadingRounds) {
    return (
      <>
        <Button appearance="secondary" icon={<Filter24Regular />} disabled>
          Välj omgångar
        </Button>
        <DrawerShell>
          <div className={styles.centered}>
            <Spinner size="medium" label="Laddar omgångar..." />
          </div>
        </DrawerShell>
      </>
    );
  }

  if (roundsError) {
    return (
      <>
        <Button
          appearance="secondary"
          icon={<Filter24Regular />}
          onClick={() => setIsOpen(true)}
        >
          Välj omgångar
        </Button>
        <DrawerShell>
          <Body1>❌ {roundsError}</Body1>
        </DrawerShell>
      </>
    );
  }

  if (allRounds.length === 0) {
    return (
      <>
        <Button
          appearance="secondary"
          icon={<Filter24Regular />}
          onClick={() => setIsOpen(true)}
        >
          Välj omgångar
        </Button>
        <DrawerShell>
          <Body1>Inga omgångar tillgängliga.</Body1>
        </DrawerShell>
      </>
    );
  }

  return (
    <>
      {/* Trigger button — always visible on the page */}
      <Button
        appearance="secondary"
        icon={<Filter24Regular />}
        onClick={() => setIsOpen(true)}
      >
        {selectedRounds.size === 0
          ? "Välj omgångar"
          : `${selectedRounds.size} omgångar valda`}
      </Button>

      {/* Overlay drawer */}
      <OverlayDrawer
        position="end"
        size="small"
        open={isOpen}
        onOpenChange={(_, { open: o }) => setIsOpen(o)}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setIsOpen(false)}
                aria-label="Stäng filterpanel"
              />
            }
          >
            Välj omgångar
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          <div className={styles.drawerBody}>
            {treeData.map((yearGroup) => {
              const yearKey = yearGroup.year;
              const isYearExpanded = expandedYears.has(yearKey);
              const yearState = yearCheckedState(yearGroup);

              return (
                <div key={yearKey}>
                  {/* Year row */}
                  <div className={styles.yearRow}>
                    <Checkbox
                      checked={yearState}
                      onChange={() => toggleYearRounds(yearGroup)}
                      aria-label={`Välj alla omgångar för ${yearKey}`}
                    />
                    <span
                      className={styles.chevron}
                      onClick={() => toggleYear(yearKey)}
                    >
                      {isYearExpanded ? "▼" : "▶"}
                    </span>
                    <Text weight="semibold" onClick={() => toggleYear(yearKey)}>
                      {yearKey}
                    </Text>
                  </div>

                  {/* Month rows */}
                  {isYearExpanded &&
                    yearGroup.months.map((monthGroup) => {
                      const monthKey = `${yearKey}-${monthGroup.month}`;
                      const isMonthExpanded = expandedMonths.has(monthKey);
                      const monthState = monthCheckedState(monthGroup.rounds);

                      return (
                        <div key={monthKey}>
                          {/* Month row */}
                          <div className={styles.monthRow}>
                            <Checkbox
                              checked={monthState}
                              onChange={() =>
                                toggleMonthRounds(monthGroup.rounds)
                              }
                              aria-label={`Välj alla omgångar för ${getSwedishMonthLabel(monthGroup.month, yearKey)}`}
                            />
                            <span
                              className={styles.chevron}
                              onClick={() => toggleMonth(monthKey)}
                            >
                              {isMonthExpanded ? "▼" : "▶"}
                            </span>
                            <Text onClick={() => toggleMonth(monthKey)}>
                              {getSwedishMonthLabel(monthGroup.month, yearKey)}
                            </Text>
                          </div>

                          {/* Round rows */}
                          {isMonthExpanded &&
                            monthGroup.rounds.map((r) => {
                              const label = `Omgång ${r.SPRoundNum}${
                                r.Comment ? ` – ${r.Comment}` : ""
                              }${r.Finished ? " (klar)" : ""}`;
                              return (
                                <div
                                  key={r.SPRoundNum}
                                  className={styles.roundRow}
                                >
                                  <Checkbox
                                    checked={selectedRounds.has(r.SPRoundNum)}
                                    onChange={() => toggleRound(r.SPRoundNum)}
                                    label={label}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            appearance="primary"
            disabled={selectedRounds.size === 0 || confirming}
            onClick={() => {
              setIsOpen(false);
              onConfirm();
            }}
            icon={confirming ? <Spinner size="tiny" /> : undefined}
          >
            {confirming
              ? "Hämtar..."
              : `Visa ställning (${selectedRounds.size} omgångar)`}
          </Button>
          <Button
            appearance="subtle"
            disabled={selectedRounds.size === 0}
            onClick={onClear}
          >
            Rensa val
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </>
  );
}

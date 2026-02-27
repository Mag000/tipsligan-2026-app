import {
  Badge,
  Body1,
  makeStyles,
  shorthands,
  Title1,
  tokens,
} from "@fluentui/react-components";
import { ReactNode } from "react";

const useStyles = makeStyles({
  header: {
    marginBottom: "32px",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding("20px", "0"),
    ...shorthands.margin("0", "-20px"),
    paddingLeft: "20px",
    paddingRight: "20px",
  },
  title: {
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.gap("12px"),
    flexWrap: "wrap",
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginBottom: "16px",
  },
  statsRow: {
    display: "flex",
    ...shorthands.gap("12px"),
    flexWrap: "wrap",
  },
  statBadge: {
    fontSize: tokens.fontSizeBase200,
  },
});

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  stats?: Array<{
    label: string;
    value: string | number;
    appearance?: "filled" | "outline" | "tint" | "ghost";
    color?:
      | "brand"
      | "danger"
      | "important"
      | "informative"
      | "severe"
      | "subtle"
      | "success"
      | "warning";
  }>;
  children?: ReactNode;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  stats,
  children,
}: PageHeaderProps) {
  const styles = useStyles();

  return (
    <div className={styles.header}>
      <div className={styles.title}>
        {icon}
        <Title1>{title}</Title1>
        {actions}
      </div>

      {subtitle && <Body1 className={styles.subtitle}>{subtitle}</Body1>}

      {stats && stats.length > 0 && (
        <div className={styles.statsRow}>
          {stats.map((stat, index) => (
            <Badge
              key={index}
              className={styles.statBadge}
              appearance={stat.appearance || "outline"}
              color={stat.color || "informative"}
            >
              {stat.label}: {stat.value}
            </Badge>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

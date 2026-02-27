import { makeStyles, shorthands } from "@fluentui/react-components";
import { ReactNode } from "react";
import { Navigation } from "./Navigation";

const useStyles = makeStyles({
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  mainContent: {
    flex: 1,
    marginTop: "56px", // Height of top navigation bar
    width: "100%",
  },
  container: {
    ...shorthands.padding("20px"),
    maxWidth: "1200px",
    ...shorthands.margin("0", "auto"),
  },
  containerFullWidth: {
    ...shorthands.padding("20px"),
    width: "100%",
    maxWidth: "none",
  },
});

interface PageContainerProps {
  children: ReactNode;
  /**
   * Optional header content always rendered inside the constrained (max-width 1200px)
   * container, regardless of the `fullWidth` prop. Use this to keep a page header
   * visually consistent with other pages while allowing the content area below to
   * expand to full viewport width (e.g. wide data tables in advanced mode).
   */
  header?: ReactNode;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  header,
  fullWidth = false,
}: PageContainerProps) {
  const styles = useStyles();
  return (
    <div className={styles.layout}>
      <Navigation />
      <main className={styles.mainContent}>
        {header && <div className={styles.container}>{header}</div>}
        <div
          className={fullWidth ? styles.containerFullWidth : styles.container}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

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
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  fullWidth = false,
}: PageContainerProps) {
  const styles = useStyles();
  return (
    <div className={styles.layout}>
      <Navigation />
      <main className={styles.mainContent}>
        <div
          className={fullWidth ? styles.containerFullWidth : styles.container}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

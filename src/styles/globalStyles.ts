import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

/**
 * Global reusable styles for the application
 * These styles can be imported and used in any component
 */
export const useGlobalStyles = makeStyles({
  // Layout containers
  centeredContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding("20px"),
  },

  fullHeightContainer: {
    minHeight: "100vh",
  },

  // Cards
  card: {
    ...shorthands.padding("24px"),
    marginBottom: "24px",
  },

  cardCompact: {
    ...shorthands.padding("16px"),
  },

  cardLarge: {
    ...shorthands.padding("32px"),
  },

  // Headers
  pageHeader: {
    marginBottom: "32px",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding("20px", "0"),
    ...shorthands.margin("0", "-20px"),
    paddingLeft: "20px",
    paddingRight: "20px",
  },

  stickyHeader: {
    position: "sticky",
    top: "0",
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 100,
    ...shorthands.padding("20px", "0"),
    ...shorthands.margin("0", "-20px"),
    paddingLeft: "20px",
    paddingRight: "20px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },

  // Text styles
  title: {
    marginBottom: "12px",
  },

  titleCentered: {
    textAlign: "center",
    marginBottom: "8px",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: "24px",
    color: tokens.colorNeutralForeground3,
  },

  // Forms
  form: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },

  inputContainer: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },

  // Loading states
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },

  loadingFullHeight: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    ...shorthands.gap("16px"),
  },

  // Empty states
  emptyState: {
    textAlign: "center",
    ...shorthands.padding("40px", "20px"),
    color: tokens.colorNeutralForeground3,
  },

  // Errors
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    textAlign: "center",
    fontSize: tokens.fontSizeBase200,
  },

  errorContainer: {
    ...shorthands.padding("16px"),
    backgroundColor: tokens.colorPaletteRedBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorPaletteRedForeground1,
  },

  // Dropdowns
  dropdown: {
    minWidth: "200px",
  },

  dropdownWide: {
    minWidth: "300px",
  },

  // Buttons
  buttonWithMarginTop: {
    marginTop: "8px",
  },

  buttonGroup: {
    display: "flex",
    ...shorthands.gap("8px"),
    flexWrap: "wrap",
  },

  // Grids
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    ...shorthands.gap("16px"),
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    ...shorthands.gap("20px"),
  },

  // Flex layouts
  flexRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
  },

  flexRowSpaceBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.gap("16px"),
  },

  flexRowWrap: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    flexWrap: "wrap",
  },

  flexColumn: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },

  // Icons
  icon: {
    fontSize: "24px",
    color: tokens.colorBrandForeground1,
  },

  iconLarge: {
    fontSize: "32px",
    color: tokens.colorBrandForeground1,
  },

  // Metadata/timestamps
  metadata: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  // Content
  content: {
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
    color: tokens.colorNeutralForeground2,
  },

  // Lists
  list: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },

  listCompact: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
});

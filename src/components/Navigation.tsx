import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  Home24Regular,
  Navigation24Regular,
  PersonRegular,
  SignOut24Regular,
  Sport24Regular,
  TrophyRegular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthToken } from "../utils/authHelpers";
import { getISOWeek, getSwedishMonthLabel } from "../utils/dateUtils";

const useStyles = makeStyles({
  // Top navigation bar (desktop)
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("12px", "24px"),
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: "56px",
    "@media (max-width: 768px)": {
      ...shorthands.padding("12px", "16px"),
    },
  },
  topNavLeft: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("32px"),
  },
  logo: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    whiteSpace: "nowrap",
  },
  // Desktop menu items (horizontal)
  desktopNav: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  desktopNavItem: {
    ...shorthands.padding("8px", "16px"),
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    cursor: "pointer",
    backgroundColor: "transparent",
    ...shorthands.border("none"),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  desktopNavItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  topNavRight: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  logoutButton: {
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  burgerButton: {
    minWidth: "auto",
    display: "none",
    "@media (max-width: 768px)": {
      display: "flex",
    },
  },
  // Mobile sidebar (same as before)
  mobileSidebar: {
    width: "240px",
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1001,
    transition: "transform 0.3s ease",
    transform: "translateX(-100%)",
    boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
    "@media (min-width: 769px)": {
      display: "none",
    },
  },
  mobileSidebarOpen: {
    transform: "translateX(0)",
  },
  overlay: {
    display: "none",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  overlayVisible: {
    display: "block",
  },
  sidebarHeader: {
    ...shorthands.padding("20px"),
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  sidebarLogo: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  mobileNav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    ...shorthands.padding("16px", "0"),
    overflowY: "auto",
  },
  mobileNavItem: {
    ...shorthands.padding("12px", "20px"),
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    cursor: "pointer",
    backgroundColor: "transparent",
    ...shorthands.border("none"),
    width: "100%",
    textAlign: "left",
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  mobileNavItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  sidebarFooter: {
    ...shorthands.padding("16px", "20px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  subNavItem: {
    ...shorthands.padding("10px", "20px", "10px", "44px"),
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    cursor: "pointer",
    backgroundColor: "transparent",
    ...shorthands.border("none"),
    width: "100%",
    textAlign: "left" as const,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
});

export function Navigation() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStandingsExpanded, setIsStandingsExpanded] = useState(false);
  // Determine which tab is active based on the current path
  const getActivePage = () => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/home")) return "home";
    if (path.startsWith("/rounds")) return "rounds";
    if (path.startsWith("/standings")) return "standings";
    if (path.startsWith("/profile")) return "profile";
    return "home";
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsSidebarOpen(false); // Close sidebar on mobile
    navigate("/login");
  };

  const activePage = getActivePage();
  const navNow = new Date();
  const navYear = navNow.getFullYear();
  const navMonth = navNow.getMonth() + 1;
  const navWeek = getISOWeek(navNow);
  const standingsSubItems = [
    { label: `Totalen ${navYear}`, path: "/standings/year" },
    {
      label: `Aktuell månad (${getSwedishMonthLabel(navMonth, navYear)})`,
      path: "/standings/month",
    },
    {
      label: `Aktuell vecka (v${navWeek} ${navYear})`,
      path: "/standings/week",
    },
    { label: "Filtrerad", path: "/standings/filter" },
  ];
  const menuItems = [
    { id: "home", label: "Hem", icon: <Home24Regular />, path: "/" },
    {
      id: "rounds",
      label: "Omgångar",
      icon: <Sport24Regular />,
      path: "/rounds",
    },
    {
      id: "profile",
      label: "Profil",
      icon: <PersonRegular />,
      path: "/profile",
    },
  ];
  return (
    <>
      {/* Top Navigation Bar */}
      <nav className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <div className={styles.logo}>⚽ Tipsligan 2026</div>

          {/* Desktop horizontal menu */}
          <div className={styles.desktopNav}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.desktopNavItem} ${
                  activePage === item.id ? styles.desktopNavItemActive : ""
                }`}
                onClick={() => handleNavigate(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            {/* Standings submenu */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <button
                  className={`${styles.desktopNavItem} ${
                    activePage === "standings"
                      ? styles.desktopNavItemActive
                      : ""
                  }`}
                >
                  <TrophyRegular />
                  <span>Tabeller</span>
                </button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {standingsSubItems.map((sub) => (
                    <MenuItem
                      key={sub.path}
                      onClick={() => handleNavigate(sub.path)}
                    >
                      {sub.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        <div className={styles.topNavRight}>
          {/* Desktop logout button */}
          <Button
            appearance="subtle"
            icon={<SignOut24Regular />}
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Logga ut
          </Button>

          {/* Mobile burger button */}
          <Button
            appearance="subtle"
            icon={<Navigation24Regular />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={styles.burgerButton}
            aria-label="Toggle menu"
          />
        </div>
      </nav>

      {/* Overlay for mobile */}
      <div
        className={`${styles.overlay} ${
          isSidebarOpen ? styles.overlayVisible : ""
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <nav
        className={`${styles.mobileSidebar} ${
          isSidebarOpen ? styles.mobileSidebarOpen : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>⚽ Tipsligan 2026</div>
        </div>

        <div className={styles.mobileNav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.mobileNavItem} ${
                activePage === item.id ? styles.mobileNavItemActive : ""
              }`}
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Standings expandable group */}
          <button
            className={`${styles.mobileNavItem} ${
              activePage === "standings" ? styles.mobileNavItemActive : ""
            }`}
            onClick={() => setIsStandingsExpanded((prev) => !prev)}
          >
            <TrophyRegular />
            <span>Tabeller {isStandingsExpanded ? "▲" : "▼"}</span>
          </button>
          {isStandingsExpanded &&
            standingsSubItems.map((sub) => (
              <button
                key={sub.path}
                className={styles.subNavItem}
                onClick={() => handleNavigate(sub.path)}
              >
                <span>{sub.label}</span>
              </button>
            ))}
        </div>

        <div className={styles.sidebarFooter}>
          <Button
            appearance="subtle"
            icon={<SignOut24Regular />}
            onClick={handleLogout}
            style={{ width: "100%" }}
          >
            Logga ut
          </Button>
        </div>
      </nav>
    </>
  );
}

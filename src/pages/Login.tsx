import {
  Body1,
  Button,
  Card,
  Input,
  makeStyles,
  shorthands,
  Spinner,
  Title1,
} from "@fluentui/react-components";
import { LockClosed24Regular, Person24Regular } from "@fluentui/react-icons";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { APIManager } from "../services/APIManager";
import { useGlobalStyles } from "../styles/globalStyles";

const useStyles = makeStyles({
  loginCard: {
    width: "100%",
    maxWidth: "400px",
    ...shorthands.padding("32px"),
  },
  flagRow: {
    display: "flex",
    justifyContent: "flex-end",
    ...shorthands.gap("8px"),
    marginBottom: "12px",
  },
  flagButton: {
    lineHeight: 1,
    cursor: "pointer",
    background: "none",
    ...shorthands.border("none"),
    ...shorthands.padding("2px", "4px"),
    ...shorthands.borderRadius("4px"),
    transition: "opacity 0.15s",
    ":hover": {
      backgroundColor: "rgba(0,0,0,0.06)",
    },
  },
  flagButtonActive: {
    opacity: "0.35",
    cursor: "default",
    pointerEvents: "none" as const,
  },
});

const SvFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 14"
    width="28"
    height="20"
    style={{ borderRadius: 2, display: "block" }}
  >
    <rect width="20" height="14" fill="#006AA7" />
    <rect x="5" width="4" height="14" fill="#FECC02" />
    <rect y="5" width="20" height="4" fill="#FECC02" />
  </svg>
);

const GbFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 14"
    width="28"
    height="20"
    style={{ borderRadius: 2, display: "block" }}
  >
    <rect width="20" height="14" fill="#012169" />
    <polygon fill="white" points="0,0 20,14 17.5,14 0,2.3" />
    <polygon fill="white" points="20,0 0,14 2.5,14 20,2.3" />
    <polygon fill="white" points="0,14 2.5,14 20,2.3 20,0 17.5,0 0,11.7" />
    <polygon fill="white" points="20,14 17.5,14 0,11.7 0,0 2.5,0 20,12.6" />
    <rect x="0" y="4.7" width="20" height="4.7" fill="white" />
    <rect x="7.5" y="0" width="5" height="14" fill="white" />
    <polygon fill="#C8102E" points="0,0 1.5,0 20,12.5 20,14 18.5,14 0,1.5" />
    <polygon fill="#C8102E" points="20,0 18.5,0 0,12.5 0,14 1.5,14 20,1.5" />
    <rect x="0" y="5.8" width="20" height="2.3" fill="#C8102E" />
    <rect x="8.5" y="0" width="3" height="14" fill="#C8102E" />
  </svg>
);

export default function Login(props: {
  onSuccess: (token: string | null) => void;
}) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    APIManager.login(username, password)
      .then((res) => {
        setIsLoading(false);
        props.onSuccess(res);
        if (!hasNavigated) {
          setHasNavigated(true);
          const from = (location.state as any)?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className={globalStyles.centeredContainer}>
      <Card className={styles.loginCard}>
        <div className={styles.flagRow}>
          <button
            className={`${styles.flagButton} ${language === "sv" ? styles.flagButtonActive : ""}`}
            onClick={() => setLanguage("sv")}
            aria-label="Svenska"
            title="Svenska"
          >
            <SvFlag />
          </button>
          <button
            className={`${styles.flagButton} ${language === "en" ? styles.flagButtonActive : ""}`}
            onClick={() => setLanguage("en")}
            aria-label="English"
            title="English"
          >
            <GbFlag />
          </button>
        </div>
        <Title1 className={globalStyles.titleCentered}>{t("app.title")}</Title1>
        <Body1 className={globalStyles.subtitle}>{t("login.subtitle")}</Body1>

        <form onSubmit={handleSubmit} className={globalStyles.form}>
          <div className={globalStyles.inputContainer}>
            <Input
              contentBefore={<Person24Regular />}
              placeholder={t("login.username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              size="large"
              disabled={isLoading}
            />
          </div>
          <div className={globalStyles.inputContainer}>
            <Input
              contentBefore={<LockClosed24Regular />}
              placeholder={t("login.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="large"
              disabled={isLoading}
            />
          </div>
          <Button
            appearance="primary"
            type="submit"
            disabled={isLoading}
            className={globalStyles.buttonWithMarginTop}
            size="large"
            icon={isLoading ? <Spinner size="tiny" /> : undefined}
          >
            {isLoading ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

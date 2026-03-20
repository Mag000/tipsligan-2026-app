import {
  Body1,
  Button,
  Card,
  makeStyles,
  shorthands,
  Title1,
  tokens,
} from "@fluentui/react-components";
import {
  Person24Regular,
  SignOut24Regular,
  Trophy24Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";

import { PageHeader } from "../components/PageHeader";
import { useLanguage } from "../contexts/LanguageContext";
import { useGlobalStyles } from "../styles/globalStyles";
import { clearAuthToken } from "../utils/authHelpers";
import { decodeAuthToken, getStoredAuthToken } from "../utils/authToken";

const useStyles = makeStyles({
  avatar: {
    width: "80px",
    height: "80px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: tokens.colorBrandBackground,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: "40px",
    marginBottom: "16px",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    display: "block",
    marginBottom: "8px",
  },
});

export default function Profile() {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  const userToken = getStoredAuthToken();
  const user = userToken ? decodeAuthToken(userToken) : null;

  return (
    <PageContainer>
      <PageHeader
        icon={<Person24Regular fontSize={32} />}
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        stats={[
          { label: t("profile.points"), value: 45, color: "brand" },
          { label: t("profile.rank"), value: "3:a", color: "success" },
          {
            label: t("profile.correctResults"),
            value: 12,
            color: "informative",
          },
        ]}
      />{" "}
      <Card className={globalStyles.cardLarge}>
        <div className={styles.avatar}>
          <Person24Regular />
        </div>
        <Title1>{user?.username || "Johan Andersson"}</Title1>
        <Body1>{t("profile.memberSince", { year: 2026 })}</Body1>

        <div className={globalStyles.statsGrid} style={{ marginTop: "24px" }}>
          <Card
            className={globalStyles.cardCompact}
            style={{ textAlign: "center" }}
          >
            <Trophy24Regular
              style={{ fontSize: "32px", marginBottom: "8px" }}
            />
            <span className={styles.statValue}>45</span>
            <Body1>{t("profile.totalPoints")}</Body1>
          </Card>

          <Card
            className={globalStyles.cardCompact}
            style={{ textAlign: "center" }}
          >
            <Trophy24Regular
              style={{ fontSize: "32px", marginBottom: "8px" }}
            />
            <span className={styles.statValue}>3</span>
            <Body1>{t("profile.rank")}</Body1>
          </Card>

          <Card
            className={globalStyles.cardCompact}
            style={{ textAlign: "center" }}
          >
            <Trophy24Regular
              style={{ fontSize: "32px", marginBottom: "8px" }}
            />{" "}
            <span className={styles.statValue}>12</span>
            <Body1>{t("profile.correctResults")}</Body1>
          </Card>
        </div>

        <Button
          appearance="primary"
          icon={<SignOut24Regular />}
          onClick={handleLogout}
          style={{ marginTop: "24px" }}
          size="large"
        >
          {t("profile.logout")}
        </Button>
      </Card>
    </PageContainer>
  );
}

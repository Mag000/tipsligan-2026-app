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
import { APIManager } from "../services/APIManager";
import { useGlobalStyles } from "../styles/globalStyles";

const useStyles = makeStyles({
  loginCard: {
    width: "100%",
    maxWidth: "400px",
    ...shorthands.padding("32px"),
  },
});

export default function Login(props: {
  onSuccess: (token: string | null) => void;
}) {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const navigate = useNavigate();
  const location = useLocation();

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
        <Title1 className={globalStyles.titleCentered}>
          ⚽ Tipsligan 2026
        </Title1>
        <Body1 className={globalStyles.subtitle}>
          Logga in för att börja tippa
        </Body1>

        <form onSubmit={handleSubmit} className={globalStyles.form}>
          <div className={globalStyles.inputContainer}>
            <Input
              contentBefore={<Person24Regular />}
              placeholder="Användarnamn"
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
              placeholder="Lösenord"
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
            {isLoading ? "Loggar in..." : "Logga in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

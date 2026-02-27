/**
 * Betting page component
 * Feature: 002-weekly-betting
 * T012: Route entry point for /betting - wired to BettingPage container
 */

import React from "react";
import { PageContainer } from "../components/PageContainer";
import BettingPage from "../components/betting/BettingPage";

const Betting: React.FC = () => {
  return (
    <PageContainer>
      <BettingPage />
    </PageContainer>
  );
};

export default Betting;

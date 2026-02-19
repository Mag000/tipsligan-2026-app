import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface Round {
  id?: number;
  SPRoundNum: number;
  Year: number;
  Week: number;
  Month?: number;
  Comment?: string;
  Finished?: boolean;
}

interface RoundSyncProps {
  availableRounds: Round[];
  currentRound: number | null;
  setCurrentRound: (round: number) => void;
}

export function RoundSync({
  availableRounds,
  currentRound,
  setCurrentRound,
}: RoundSyncProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract round from URL if on /rounds route
  useEffect(() => {
    const match = location.pathname.match(/^\/rounds\/(\d+)/);
    if (match) {
      const urlRound = parseInt(match[1], 10);
      if (urlRound && urlRound !== currentRound) {
        console.log(`📍 URL round changed to ${urlRound}`);
        setCurrentRound(urlRound);
      }
    } else if (location.pathname === "/rounds") {
      // On /rounds without round, navigate to current or latest
      if (currentRound) {
        navigate(`/rounds/${currentRound}`, { replace: true });
      } else if (availableRounds.length > 0) {
        const latestRound = availableRounds[0].SPRoundNum;
        navigate(`/rounds/${latestRound}`, { replace: true });
      }
    }
  }, [
    location.pathname,
    currentRound,
    availableRounds,
    setCurrentRound,
    navigate,
  ]);

  return null;
}

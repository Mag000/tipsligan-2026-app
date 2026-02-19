// Types matching the C# DTOs for round and match management

export interface roundSet {
  Id: string;
  Year: number;
  Week: number;
  Month: number;
  NoRow: string;
  Comment: string;
  Confirmed: boolean;
  Finished: boolean | null;
  SPRoundNum: number;
  Deadline?: string; // Added for deadline tracking
  matches: MatchesSetDTO[];
  bets: BettingsSetDTO[];
}

export interface MatchesSetDTO {
  Id: string;
  RoundId: number;
  MatchNumber: number;
  HomeTeam: string;
  AwayTeam: string;
  GoalsHome: number;
  GoalsAway: number;
  Confirmed: boolean;
  Comment: string;
  Deadline?: string; // sportEventStart will be mapped here
}

export interface BettingsSetDTO {
  // Add betting properties as needed
  [key: string]: any;
}

// Request payload for creating a new round from Svenska Spel draw
export interface CreateRoundFromDrawRequest {
  drawNumber: number;
  drawComment: string;
  closeTime: string;
  events: {
    eventNumber: number;
    homeTeamName: string;
    awayTeamName: string;
    sportEventStart: string;
  }[];
}

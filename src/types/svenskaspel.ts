// Svenska Spel API Contracts

export interface SessionInfo {
  sessionId: string;
  // Add other session fields as discovered from API responses
}

export interface SessionUser {
  userId: string;
  username?: string;
  // Add other user fields as discovered from API responses
}

export interface ClientInfo {
  platform?: string;
  version?: string;
  // Add other client fields as discovered from API responses
}

export interface SvenskaSpelResponse {
  draw: DrawInfo;
  error: string | null;
  requestInfo: {
    elapsedTime: number;
    apiVersion: number;
  };
  requestId: string;
  sessionId: string | null;
  deviceId: string;
  session: SessionInfo | null;
  sessionUser: SessionUser | null;
  clientInfo: ClientInfo | null;
}

export interface SvenskaSpelResultResponse {
  result: ResultInfo;
  error: string | null;
  requestInfo: {
    elapsedTime: number;
    apiVersion: number;
  };
  requestId: string;
  sessionId: string | null;
  deviceId: string;
  session: SessionInfo | null;
  sessionUser: SessionUser | null;
  clientInfo: ClientInfo | null;
}

export interface ResultInfo {
  cancelled: boolean;
  events: ResultEvent[];
  distribution: WinnerDistribution[];
  productName: string;
  productId: number;
  drawNumber: number;
  openTime: string;
  closeTime: string;
  turnover: string;
  sport: string;
  sportId: number;
  checksum: string;
}

export interface ResultEvent {
  eventNumber: number;
  eventComment: string;
  description: string;
  cancelled: boolean;
  outcome: string; // "1", "X", or "2"
  outcomeScore: string; // e.g., "0-1"
  providerIds: ProviderId[];
}

export interface WinnerDistribution {
  winners: number;
  amount: string;
  name: string; // e.g., "13 rätt", "12 rätt"
}

export interface FundInfo {
  amount: string;
  currency?: string;
  // Add other fund fields as discovered from API responses
}

export interface DrawInfo {
  drawComment: string;
  extraInfo: string | null;
  drawState: string;
  fund: FundInfo | null;
  lastDateWithoutTimeOfDay: string;
  events: DrawEvent[];
  jackpotItems: JackpotItem[];
  productName: string;
  productId: number;
  drawNumber: number;
  openTime: string;
  closeTime: string;
  turnover: string;
  sport: string;
  sportId: number;
  checksum: string;
}

export interface JackpotItem {
  description: string;
  amount: string;
}

export interface OutcomesInfo {
  home?: string;
  draw?: string;
  away?: string;
  // Add other outcome fields as discovered from API responses
}

export interface DrawEvent {
  eventNumber: number;
  description: string;
  cancelled: boolean;
  extraInfo: string | null;
  eventTypeDescription: string;
  participantType: string;
  outcomes: OutcomesInfo | null;
  odds: Odds | null;
  distribution: Distribution;
  newspaperAdvice: NewspaperAdvice;
  league: League;
  participants: Participant[];
  sportEventId: number;
  sportEventStart: string;
  sportEventStatus: string;
  favouriteOdds: Odds | null;
  startOdds: Odds | null;
  randomResultProbability: RandomResultProbability;
  complementaryOdds: Odds | null;
  complementaryFavouriteOdds: Odds | null;
  providerIds: ProviderId[];
  outcomeScore?: string; // e.g., "1-0" for finished matches
}

export interface Odds {
  home: string;
  draw: string;
  away: string;
  date?: string | null;
  refDate?: string | null;
}

export interface Distribution {
  home: string;
  draw: string;
  away: string;
  date: string;
  refHome: string;
  refDraw: string;
  refAway: string;
  refDate: string;
}

export interface NewspaperAdvice {
  home: string;
  draw: string;
  away: string;
  date?: string | null;
  refDate?: string | null;
}

export interface RandomResultProbability {
  home: string;
  draw: string;
  away: string;
}

export interface ProviderId {
  provider: string;
  type: string;
  id: string;
}

export interface League {
  id: number;
  name: string;
  season: {
    id: number;
    name: string;
  };
  country: {
    id: number;
    name: string;
  };
}

export interface Participant {
  id: number;
  type: "home" | "away";
  name: string;
}

// Helper type for displaying matches
export interface MatchDisplay {
  eventNumber: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  country: string;
  startTime: string;
  status: string;
  odds: {
    home: string;
    draw: string;
    away: string;
  } | null;
  distribution: {
    home: string;
    draw: string;
    away: string;
  };
  newspaperAdvice: {
    home: string;
    draw: string;
    away: string;
  };
  outcomeScore?: string;
}

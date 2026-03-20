export type Language = "sv" | "en";

const sv = {
  // ── App ──────────────────────────────────────────────────────────────────
  "app.title": "⚽ Tipsligan 2026",

  // ── Common ───────────────────────────────────────────────────────────────
  "common.loading": "Laddar...",
  "common.save": "Spara",
  "common.cancel": "Avbryt",
  "common.retry": "Försök igen",
  "common.unknown": "Okänd",
  "common.confirmed": "Bekräftad",
  "common.safeMatch": "Säker match",

  // ── Login ─────────────────────────────────────────────────────────────────
  "login.subtitle": "Logga in för att börja tippa",
  "login.username": "Användarnamn",
  "login.password": "Lösenord",
  "login.submit": "Logga in",
  "login.submitting": "Loggar in...",

  // ── Navigation ────────────────────────────────────────────────────────────
  "nav.home": "Krönikan",
  "nav.rounds": "Omgångar",
  "nav.standings": "Tabeller",
  "nav.profile": "Profil",
  "nav.logout": "Logga ut",
  "nav.toggleMenu": "Öppna meny",
  "nav.standingsYear": "Totalen {{year}}",
  "nav.standingsMonth": "Aktuell månad ({{month}})",
  "nav.standingsWeek": "Aktuell vecka (v{{week}} {{year}})",
  "nav.standingsFiltered": "Filtrerad",
  "nav.languageLabel": "EN",

  // ── Home ──────────────────────────────────────────────────────────────────
  "home.loadingChronicle": "Laddar krönika...",
  "home.published": "Publicerad:",
  "home.comments": "Kommentarer ({{count}})",
  "home.writeComment": "Skriv en kommentar...",
  "home.sending": "Skickar...",
  "home.sendComment": "Skicka kommentar",
  "home.loadingComments": "Laddar kommentarer...",
  "home.noComments": "Inga kommentarer än",
  "home.noChronicle": "Ingen krönika tillgänglig",
  "home.errorUpdateComment": "Kunde inte uppdatera kommentaren.",
  "home.confirmDeleteComment":
    "Är du säker på att du vill ta bort denna kommentar?",
  "home.errorDeleteComment": "Kunde inte ta bort kommentaren.",
  "home.errorNoChronicle": "Ingen krönika vald",
  "home.errorCreateComment": "Kunde inte skapa kommentaren.",

  // ── Standings ─────────────────────────────────────────────────────────────
  "standings.title": "Ställningar",
  "standings.detailed": "Detaljerat",
  "standings.loading": "Laddar ställningar...",
  "standings.loadingFilter": "Hämtar ställning...",
  "standings.noData": "Inga ställningar tillgängliga ännu",
  "standings.error": "Fel vid hämtning av ställning",
  "standings.scopeYear": "Totalen {{year}}",
  "standings.scopeWeek": "Vecka {{week}} – {{year}}",
  "standings.scopeFiltered": "Filtrerad",
  "standings.scopeFilteredRounds": "Filtrerad: {{count}} omgångar",
  "standings.player": "Spelare",

  // ── Profile ───────────────────────────────────────────────────────────────
  "profile.title": "Min Profil",
  "profile.subtitle": "Din statistik och prestationer",
  "profile.points": "Poäng",
  "profile.rank": "Placering",
  "profile.correctResults": "Rätt resultat",
  "profile.memberSince": "Medlem sedan {{year}}",
  "profile.totalPoints": "Totala poäng",
  "profile.logout": "Logga ut",

  // ── Elimineringen ─────────────────────────────────────────────────────────
  "elim.title": "Elimineringen",
  "elim.subtitle": "Deltävlingar",
  "elim.loading": "Laddar Elimineringen...",
  "elim.errorLoading": "Kunde inte ladda Elimineringen",
  "elim.selectRound": "Välj omgång",
  "elim.live": "⚡",
  "elim.history": "Elimineringshistorik – {{eliminated}} av {{total}} utslagna",
  "elim.week": "v.{{week}}",
  "elim.noData": "Inga Elimineringen-data tillgängliga ännu.",
  "elim.accumulatedStats": "Ackumulerad statistik",
  "elim.roundOption": "v. {{week}} (omg. {{roundNum}})",

  // ── Rounds ────────────────────────────────────────────────────────────────
  "rounds.loading": "Laddar...",
  "rounds.selectRound": "Välj omgång...",
  "rounds.roundLabel": "{{year}} - Vecka {{week}}",
  "rounds.currentRoundFallback": "Omgång {{round}}",
  "rounds.halvgarderingar": "{{count}} / {{max}} halvgarderingar",
  "rounds.finalized": "Avslutad",
  "rounds.refreshing": "Uppdaterar...",
  "rounds.refresh": "Uppdatera omgångsdata",
  "rounds.myBet": "Mitt tips",
  "rounds.statusFinished": "Avslutad",
  "rounds.statusStarted": "Pågår",
  "rounds.statusNotStarted": "Ej startad",
  "rounds.tooltipRoundStarted": "Omgången har påbörjats",
  "rounds.tooltipCantHalvgardaSafe": "Halvgardering kan inte vara säkermatch",
  "rounds.tooltipRemoveSafe": "Klicka för att ta bort säkermatch",
  "rounds.tooltipSetSafe": "Klicka för att markera som säkermatch",
  "rounds.tooltipPlaceBetFirst": "Placera ett tips först",
  "rounds.odds": "Odds",
  "rounds.publicVote": "Svenska Folket",
  "rounds.newspaperTips": "10 Tidningars Tips",
  "rounds.distribution": "Streckfördelning",
  "rounds.allParticipants": "Alla deltagare",
  "rounds.filtered": "Filtrerat: {{bet}}",
  "rounds.toast.refreshed": "Data uppdaterad",
  "rounds.toast.refreshFailed": "Kunde inte uppdatera data",
  "rounds.toast.cantHalvgardaSafe": "Kan inte halvgarda säkermatch",
  "rounds.toast.cantHalvgardaSafeBody": "Ta bort säkermatch-märkningen först.",
  "rounds.toast.maxHalvgarderingar": "Max 7 halvgarderingar",
  "rounds.toast.maxHalvgarderingarBody":
    "Du kan inte halvgarda fler matcher denna omgång.",
  "rounds.toast.saveFailed": "Kunde inte spara tips",
  "rounds.toast.saveFailedBody": "Försök igen.",
  "rounds.finalizeButton": "Slutför alla tips",
  "rounds.finalizeDialogTitle": "Bekräfta slutförande",
  "rounds.finalizeDialogText":
    "Är du säker på att du vill slutföra alla dina tips för denna omgång?",
  "rounds.finalizeDialogWarning":
    "⚠️ När du bekräftar kan du inte längre ändra eller lägga till fler tips för denna omgång.",
  "rounds.finalizeConfirm": "Slutför",
  "rounds.finalizeCancel": "Avbryt",
  "rounds.finalizeTooltipAlready": "Du har redan bekräftat dina tips",
  "rounds.finalizeTooltipMissingBets":
    "Tippa alla {{total}} matcher innan du kan slutföra",
  "rounds.finalizeTooltipMissingHalv":
    "Använd alla {{max}} halvgarderingar innan du kan slutföra",
  "rounds.finalizeTooltipMissingSafe":
    "Välj en säker match innan du kan slutföra",
  "rounds.hintAlreadyConfirmed":
    "✅ Du har redan bekräftat dina tips för denna omgång.",
  "rounds.hintMissingBets":
    "Du måste tippa alla {{total}} matcher ({{placed}}/{{total}} gjorda).",
  "rounds.hintMissingHalv":
    "Du måste använda alla {{max}} halvgarderingar ({{count}}/{{max}} använda).",
  "rounds.hintMissingSafe": "Du måste välja en säker match.",
} as const;

const en: typeof sv = {
  // ── App ──────────────────────────────────────────────────────────────────
  "app.title": "⚽ Tipsligan 2026",

  // ── Common ───────────────────────────────────────────────────────────────
  "common.loading": "Loading...",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.retry": "Try again",
  "common.unknown": "Unknown",
  "common.confirmed": "Confirmed",
  "common.safeMatch": "Safe match",

  // ── Login ─────────────────────────────────────────────────────────────────
  "login.subtitle": "Sign in to start betting",
  "login.username": "Username",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.submitting": "Signing in...",

  // ── Navigation ────────────────────────────────────────────────────────────
  "nav.home": "Chronicle",
  "nav.rounds": "Rounds",
  "nav.standings": "Standings",
  "nav.profile": "Profile",
  "nav.logout": "Logout",
  "nav.toggleMenu": "Toggle menu",
  "nav.standingsYear": "Total {{year}}",
  "nav.standingsMonth": "Current month ({{month}})",
  "nav.standingsWeek": "Current week (w{{week}} {{year}})",
  "nav.standingsFiltered": "Filtered",
  "nav.languageLabel": "SV",

  // ── Home ──────────────────────────────────────────────────────────────────
  "home.loadingChronicle": "Loading chronicle...",
  "home.published": "Published:",
  "home.comments": "Comments ({{count}})",
  "home.writeComment": "Write a comment...",
  "home.sending": "Sending...",
  "home.sendComment": "Send comment",
  "home.loadingComments": "Loading comments...",
  "home.noComments": "No comments yet",
  "home.noChronicle": "No chronicle available",
  "home.errorUpdateComment": "Could not update the comment.",
  "home.confirmDeleteComment": "Are you sure you want to delete this comment?",
  "home.errorDeleteComment": "Could not delete the comment.",
  "home.errorNoChronicle": "No chronicle selected",
  "home.errorCreateComment": "Could not create the comment.",

  // ── Standings ─────────────────────────────────────────────────────────────
  "standings.title": "Standings",
  "standings.detailed": "Detailed",
  "standings.loading": "Loading standings...",
  "standings.loadingFilter": "Fetching standings...",
  "standings.noData": "No standings available yet",
  "standings.error": "Error fetching standings",
  "standings.scopeYear": "Total {{year}}",
  "standings.scopeWeek": "Week {{week}} – {{year}}",
  "standings.scopeFiltered": "Filtered",
  "standings.scopeFilteredRounds": "Filtered: {{count}} rounds",
  "standings.player": "Players",

  // ── Profile ───────────────────────────────────────────────────────────────
  "profile.title": "My Profile",
  "profile.subtitle": "Your stats and achievements",
  "profile.points": "Points",
  "profile.rank": "Rank",
  "profile.correctResults": "Correct results",
  "profile.memberSince": "Member since {{year}}",
  "profile.totalPoints": "Total points",
  "profile.logout": "Logout",

  // ── Elimineringen ─────────────────────────────────────────────────────────
  "elim.title": "Elimineringen",
  "elim.subtitle": "Sub-competitions",
  "elim.loading": "Loading Elimineringen...",
  "elim.errorLoading": "Could not load Elimineringen",
  "elim.selectRound": "Select round",
  "elim.live": "⚡",
  "elim.history":
    "Elimination history – {{eliminated}} of {{total}} eliminated",
  "elim.week": "w.{{week}}",
  "elim.noData": "No Elimineringen data available yet.",
  "elim.accumulatedStats": "Accumulated statistics",
  "elim.roundOption": "w. {{week}} (round {{roundNum}})",

  // ── Rounds ────────────────────────────────────────────────────────────────
  "rounds.loading": "Loading...",
  "rounds.selectRound": "Select round...",
  "rounds.roundLabel": "{{year}} - Week {{week}}",
  "rounds.currentRoundFallback": "Round {{round}}",
  "rounds.halvgarderingar": "{{count}} / {{max}} half-hedges",
  "rounds.finalized": "Confirmed",
  "rounds.refreshing": "Refreshing...",
  "rounds.refresh": "Refresh round data",
  "rounds.myBet": "My bet",
  "rounds.statusFinished": "Finished",
  "rounds.statusStarted": "In progress",
  "rounds.statusNotStarted": "Not started",
  "rounds.tooltipRoundStarted": "Round has started",
  "rounds.tooltipCantHalvgardaSafe": "Half-hedge cannot be safe match",
  "rounds.tooltipRemoveSafe": "Click to remove safe match",
  "rounds.tooltipSetSafe": "Click to mark as safe match",
  "rounds.tooltipPlaceBetFirst": "Place a bet first",
  "rounds.odds": "Odds",
  "rounds.publicVote": "Public vote",
  "rounds.newspaperTips": "10 Newspaper tips",
  "rounds.distribution": "Distribution",
  "rounds.allParticipants": "All participants",
  "rounds.filtered": "Filtered: {{bet}}",
  "rounds.toast.refreshed": "Data refreshed",
  "rounds.toast.refreshFailed": "Failed to refresh data",
  "rounds.toast.cantHalvgardaSafe": "Cannot half-hedge safe match",
  "rounds.toast.cantHalvgardaSafeBody": "Remove the safe match mark first.",
  "rounds.toast.maxHalvgarderingar": "Max 7 half-hedges",
  "rounds.toast.maxHalvgarderingarBody":
    "You cannot half-hedge more matches this round.",
  "rounds.toast.saveFailed": "Could not save bet",
  "rounds.toast.saveFailedBody": "Please try again.",
  "rounds.finalizeButton": "Confirm all bets",
  "rounds.finalizeDialogTitle": "Confirm submission",
  "rounds.finalizeDialogText":
    "Are you sure you want to confirm all your bets for this round?",
  "rounds.finalizeDialogWarning":
    "⚠️ Once confirmed, you can no longer change or add more bets for this round.",
  "rounds.finalizeConfirm": "Confirm",
  "rounds.finalizeCancel": "Cancel",
  "rounds.finalizeTooltipAlready": "You have already confirmed your bets",
  "rounds.finalizeTooltipMissingBets":
    "Bet on all {{total}} matches before you can confirm",
  "rounds.finalizeTooltipMissingHalv":
    "Use all {{max}} half-hedges before you can confirm",
  "rounds.finalizeTooltipMissingSafe":
    "Choose a safe match before you can confirm",
  "rounds.hintAlreadyConfirmed":
    "✅ You have already confirmed your bets for this round.",
  "rounds.hintMissingBets":
    "You must bet on all {{total}} matches ({{placed}}/{{total}} done).",
  "rounds.hintMissingHalv":
    "You must use all {{max}} half-hedges ({{count}}/{{max}} used).",
  "rounds.hintMissingSafe": "You must choose a safe match.",
};

export const translations: Record<Language, typeof sv> = { sv, en };

export type TranslationKey = keyof typeof sv;

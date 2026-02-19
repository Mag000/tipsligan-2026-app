# Tre-Nivå Grupperade Headers för Ställningar ✅

## Översikt

Omorganiserade ställningstabellen med en tre-nivå header-struktur som grupperar statistik logiskt:

1. **Huvudgrupper**: Singeltecken och Garderingar
2. **Undergrupper**: Ettor, Kryss, Tvåor, 1X, X2, 12
3. **Kolumnheaders**: Sp (Spelade), Tr (Träffade), % (Procent)

## Ny Struktur

### Visuell Representation

```
┌──────┬────────┬──────┬───────┬───────────────────────────────────────┬─────────────────────────────────────┐
│      │        │      │       │        SINGELTECKEN (span 9)          │      GARDERINGAR (span 9)            │
│ Plats│ Spelare│ Rätt │ Skydd ├───────────┬───────────┬───────────────┼───────────┬───────────┬─────────────┤
│      │        │      │       │   Ettor   │   Kryss   │    Tvåor      │    1X     │    X2     │     12      │
│ (4)  │  (4)   │  (4) │  (4)  ├───┬───┬───┼───┬───┬───┼───┬───┬───────┼───┬───┬───┼───┬───┬───┼───┬───┬─────┤
│      │        │      │       │Sp │Tr │ % │Sp │Tr │ % │Sp │Tr │   %   │Sp │Tr │ % │Sp │Tr │ % │Sp │Tr │  %  │
└──────┴────────┴──────┴───────┴───┴───┴───┴───┴───┴───┴───┴───┴───────┴───┴───┴───┴───┴───┴───┴───┴───┴─────┘
```

**Förklaring:**

- Siffrorna i parentes = antal rader som cellen spannar
- Singeltecken = 9 kolumner (3 undergrupper × 3 kolumner)
- Garderingar = 9 kolumner (3 undergrupper × 3 kolumner)

## CSS-ändringar

### 1. Huvudgrupp Header (Nivå 1)

```typescript
mainGroupHeader: {
  gridColumn: "span 9",           // Spänner över 9 kolumner
  textAlign: "center",
  fontWeight: tokens.fontWeightBold,
  fontSize: "12px",
  padding: "8px 0",
  backgroundColor: tokens.colorBrandBackground,      // Blå bakgrund
  color: tokens.colorNeutralForegroundOnBrand,       // Vit text
  borderBottom: "2px solid tokens.colorBrandStroke1",
}
```

**Resultat:** Tydlig blå header som visuellt separerar huvudkategorierna

### 2. Undergrupp Header (Nivå 2)

```typescript
subGroupHeader: {
  gridColumn: "span 3",           // Spänner över 3 kolumner
  textAlign: "center",
  fontWeight: tokens.fontWeightSemibold,
  fontSize: "10px",
  padding: "6px 0",
  backgroundColor: tokens.colorNeutralBackground4,   // Grå bakgrund
  color: tokens.colorNeutralForeground2,             // Mörkgrå text
  borderBottom: "1px solid tokens.colorNeutralStroke2",
}
```

**Resultat:** Neutral grå bakgrund som skiljer sig från huvudgruppen

### 3. Kolumn Header (Nivå 3)

```typescript
columnHeader: {
  textAlign: "right",
  fontSize: "9px",
  padding: "4px 0",
  backgroundColor: tokens.colorNeutralBackground2,   // Ljusare grå
}
```

**Resultat:** Ljusare bakgrund för de minsta rubrikerna

## JSX Header-struktur

```tsx
{/* Fasta kolumner - spänner över alla 3 rader */}
<div style={{ gridRow: "1 / 4" }}>Plats</div>
<div style={{ gridRow: "1 / 4" }}>Spelare</div>
<div style={{ gridRow: "1 / 4" }}>Rätt</div>
<div style={{ gridRow: "1 / 4" }}>Skydd</div>

{/* Row 1 - Huvudgrupper */}
<div className={styles.mainGroupHeader}>Singeltecken</div>
<div className={styles.mainGroupHeader}>Garderingar</div>

{/* Row 2 - Undergrupper */}
<div className={styles.subGroupHeader}>Ettor</div>
<div className={styles.subGroupHeader}>Kryss</div>
<div className={styles.subGroupHeader}>Tvåor</div>
<div className={styles.subGroupHeader}>1X</div>
<div className={styles.subGroupHeader}>X2</div>
<div className={styles.subGroupHeader}>12</div>

{/* Row 3 - Kolumnheaders (upprepas 6 gånger) */}
<div className={styles.columnHeader}>Sp</div>
<div className={styles.columnHeader}>Tr</div>
<div className={styles.columnHeader}>%</div>
<!-- ...repeated 5 more times -->
```

## Dataflöde (oförändrat)

Data visas i samma ordning som tidigare:

```tsx
{/* Singeltecken */}
{player.single1Bets} {player.single1Hits} {calcPercent(...)}  // Ettor
{player.singleXBets} {player.singleXHits} {calcPercent(...)}  // Kryss
{player.single2Bets} {player.single2Hits} {calcPercent(...)}  // Tvåor

{/* Garderingar */}
{player.hedge1XBets} {player.hedge1XHits} {calcPercent(...)}  // 1X
{player.hedgeX2Bets} {player.hedgeX2Hits} {calcPercent(...)}  // X2
{player.hedge12Bets} {player.hedge12Hits} {calcPercent(...)}  // 12
```

## Färgschema

### Fluent UI Tokens Används:

1. **Huvudgrupper (Singeltecken, Garderingar)**

   - Bakgrund: `colorBrandBackground` (Blå brand-färg)
   - Text: `colorNeutralForegroundOnBrand` (Vit för kontrast)
   - Border: `colorBrandStroke1` (Mörkare blå)

2. **Undergrupper (Ettor, Kryss, Tvåor, 1X, X2, 12)**

   - Bakgrund: `colorNeutralBackground4` (Mörk neutral grå)
   - Text: `colorNeutralForeground2` (Standard textfärg)
   - Border: `colorNeutralStroke2` (Tunn border)

3. **Kolumnheaders (Sp, Tr, %)**
   - Bakgrund: `colorNeutralBackground2` (Ljusare grå)
   - Text: Ärver från parent
   - Border: Ingen

## Fördelar med Ny Struktur

### ✅ Visuell Hierarki

- Tre tydliga nivåer gör det lätt att förstå datastrukturen
- Färgkodning hjälper ögat att navigera

### ✅ Logisk Gruppering

- **Singeltecken** grupperar alla enkla spel (1, X, 2)
- **Garderingar** grupperar alla hedge-spel (1X, X2, 12)
- Gör det enkelt att jämföra strategi mellan spelare

### ✅ Bättre UX

- Användare ser omedelbart de två huvudkategorierna
- Färgerna skapar tydlig separation
- Grid spans gör strukturen självförklarande

## Tekniska Detaljer

### Grid Row Spanning

```typescript
gridRow: "1 / 4"; // Spänner från rad 1 till rad 4 (3 rader totalt)
```

### Grid Column Spanning

```typescript
gridColumn: "span 9"; // Spänner över 9 kolumner
gridColumn: "span 3"; // Spänner över 3 kolumner
```

### Header Grid Structure

Advanced view har nu 3 rader istället för 2:

- **Rad 1**: Fasta kolumner (4) + Huvudgrupper (2 × span 9)
- **Rad 2**: Fasta kolumner (fortsätter) + Undergrupper (6 × span 3)
- **Rad 3**: Fasta kolumner (fortsätter) + Kolumnheaders (18 × 1)

## Testning

### Att verifiera:

1. ✅ Huvudgrupper visas med blå bakgrund
2. ✅ Undergrupper visas med grå bakgrund
3. ✅ Kolumnheaders har ljusare grå bakgrund
4. ✅ Fasta kolumner (Plats, Spelare, Rätt, Skydd) spänner över alla 3 rader
5. ✅ "Singeltecken" spänner över Ettor + Kryss + Tvåor
6. ✅ "Garderingar" spänner över 1X + X2 + 12
7. ✅ Alla borders och spacing ser bra ut

## Relaterade Filer

- `src/pages/Standings.tsx` - Alla ändringar

## Nästa Steg

✅ **Komplett!** Tabellen har nu en professionell tre-nivå header-struktur med tydlig färgkodning

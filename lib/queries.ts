/**
 * Server-side query helpers.
 */

import { db } from "@/db";
import {
  shows,
  artists,
  agents,
  agencies,
  deals,
  ticketSales,
  expenses,
  settlements,
  venues,
} from "@/db/schema";
import { desc, asc, eq, sql } from "drizzle-orm";

export async function getAllShows() {
  return db
    .select({
      show: shows,
      artist: artists,
      agent: agents,
      deal: deals,
      settlement: settlements,
    })
    .from(shows)
    .leftJoin(artists, eq(shows.artistId, artists.id))
    .leftJoin(agents, eq(artists.agentId, agents.id))
    .leftJoin(deals, eq(deals.showId, shows.id))
    .leftJoin(settlements, eq(settlements.showId, shows.id))
    .orderBy(asc(shows.date));
}

export async function getShowById(id: string) {
  const rows = await db
    .select({
      show: shows,
      artist: artists,
      agent: agents,
      agency: agencies,
      deal: deals,
      settlement: settlements,
      venue: venues,
    })
    .from(shows)
    .leftJoin(artists, eq(shows.artistId, artists.id))
    .leftJoin(agents, eq(artists.agentId, agents.id))
    .leftJoin(agencies, eq(agents.agencyId, agencies.id))
    .leftJoin(deals, eq(deals.showId, shows.id))
    .leftJoin(settlements, eq(settlements.showId, shows.id))
    .leftJoin(venues, eq(shows.venueId, venues.id))
    .where(eq(shows.id, id));

  if (rows.length === 0) return null;
  const row = rows[0];

  const [showTicketSales, showExpenses] = await Promise.all([
    db
      .select()
      .from(ticketSales)
      .where(eq(ticketSales.showId, id))
      .orderBy(desc(ticketSales.capturedAt)),
    db
      .select()
      .from(expenses)
      .where(eq(expenses.showId, id))
      .orderBy(asc(expenses.enteredAt)),
  ]);

  return {
    ...row,
    ticketSales: showTicketSales,
    expenses: showExpenses,
  };
}

export type ShowWithRelations = NonNullable<
  Awaited<ReturnType<typeof getShowById>>
>;

/** All artists with show counts. */
export async function getAllArtists() {
  return db
    .select({
      artist: artists,
      agent: agents,
      agency: agencies,
      showCount: sql<number>`count(${shows.id})`.as("show_count"),
      lastShowDate: sql<string | null>`max(${shows.date})`.as("last_show_date"),
    })
    .from(artists)
    .leftJoin(agents, eq(artists.agentId, agents.id))
    .leftJoin(agencies, eq(agents.agencyId, agencies.id))
    .leftJoin(shows, eq(shows.artistId, artists.id))
    .groupBy(artists.id, agents.id, agencies.id)
    .orderBy(desc(sql`count(${shows.id})`), asc(artists.name));
}

/** Aggregates for the reports page. */
export async function getReports() {
  const allDealsRows = await db.select().from(deals);
  const allSettlementsRows = await db.select().from(settlements);
  const allShowsRows = await db.select().from(shows);

  const dealTypeCounts: Record<string, number> = {};
  for (const d of allDealsRows) {
    dealTypeCounts[d.dealType] = (dealTypeCounts[d.dealType] ?? 0) + 1;
  }

  const totalDeals = allDealsRows.length;
  const supportedTypes = ["flat", "percentage_of_gross"];
  const supportedCount = allDealsRows.filter((d) =>
    supportedTypes.includes(d.dealType),
  ).length;
  const inAppToolUsageRate = totalDeals > 0 ? supportedCount / totalDeals : 0;

  const settlementStatus: Record<string, number> = {};
  for (const s of allSettlementsRows) {
    settlementStatus[s.status] = (settlementStatus[s.status] ?? 0) + 1;
  }

  const totalSettlements = allSettlementsRows.length;
  const disputedRate =
    totalSettlements > 0
      ? (settlementStatus.disputed ?? 0) / totalSettlements
      : 0;

  const totalGross = allSettlementsRows.reduce(
    (sum, s) => sum + (s.grossBoxOffice ?? 0),
    0,
  );
  const totalToArtists = allSettlementsRows.reduce(
    (sum, s) => sum + (s.totalToArtist ?? 0),
    0,
  );

  const showCount = allShowsRows.length;
  const settledCount = allShowsRows.filter((s) => s.status === "settled")
    .length;

  return {
    dealTypeCounts,
    totalDeals,
    inAppToolUsageRate,
    settlementStatus,
    totalSettlements,
    disputedRate,
    totalGross,
    totalToArtists,
    showCount,
    settledCount,
  };
}

export type Reports = Awaited<ReturnType<typeof getReports>>;

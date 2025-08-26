import { db } from '../db';
import { fundsTable, portfoliosTable } from '../db/schema';
import { type FundSummary } from '../schema';
import { sql, desc, eq } from 'drizzle-orm';

export async function getFundSummary(): Promise<FundSummary> {
  try {
    // Get basic fund statistics
    const fundStatsResult = await db.select({
      total_funds: sql<number>`count(*)::int`,
      total_assets_under_management: sql<string>`coalesce(sum(${fundsTable.total_assets}), 0)`,
      average_nav: sql<string>`coalesce(avg(${fundsTable.nav}), 0)`
    })
    .from(fundsTable)
    .execute();

    const fundStats = fundStatsResult[0];

    // Get the top performing fund based on portfolio performance
    const topPerformingFundResult = await db.select({
      fund_name: fundsTable.name,
      avg_performance: sql<string>`avg(${portfoliosTable.performance})`
    })
    .from(fundsTable)
    .innerJoin(portfoliosTable, eq(fundsTable.id, portfoliosTable.fund_id))
    .groupBy(fundsTable.id, fundsTable.name)
    .orderBy(desc(sql`avg(${portfoliosTable.performance})`))
    .limit(1)
    .execute();

    const topPerformingFund = topPerformingFundResult.length > 0 
      ? topPerformingFundResult[0].fund_name 
      : null;

    return {
      total_funds: fundStats.total_funds,
      total_assets_under_management: parseFloat(fundStats.total_assets_under_management),
      average_nav: parseFloat(fundStats.average_nav),
      top_performing_fund: topPerformingFund
    };
  } catch (error) {
    console.error('Fund summary generation failed:', error);
    throw error;
  }
}
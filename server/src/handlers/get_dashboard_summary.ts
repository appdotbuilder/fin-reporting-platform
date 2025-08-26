import { db } from '../db';
import { fundsTable, portfoliosTable } from '../db/schema';
import { type DashboardSummary } from '../schema';
import { desc, avg, sum, count } from 'drizzle-orm';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // Get fund summary statistics
    const fundStats = await db.select({
      total_funds: count(fundsTable.id),
      total_assets_under_management: sum(fundsTable.total_assets),
      average_nav: avg(fundsTable.nav),
    })
    .from(fundsTable)
    .execute();

    // Get top performing fund (highest NAV)
    const topFund = await db.select({
      name: fundsTable.name,
    })
    .from(fundsTable)
    .orderBy(desc(fundsTable.nav))
    .limit(1)
    .execute();

    // Get portfolio summary statistics
    const portfolioStats = await db.select({
      total_portfolios: count(portfoliosTable.id),
      total_portfolio_value: sum(portfoliosTable.total_value),
      average_performance: avg(portfoliosTable.performance),
    })
    .from(portfoliosTable)
    .execute();

    // Get best performing portfolio (highest performance percentage)
    const bestPortfolio = await db.select({
      name: portfoliosTable.name,
    })
    .from(portfoliosTable)
    .orderBy(desc(portfoliosTable.performance))
    .limit(1)
    .execute();

    // Extract values and convert numeric fields
    const fundStat = fundStats[0];
    const portfolioStat = portfolioStats[0];

    return {
      fund_summary: {
        total_funds: fundStat.total_funds || 0,
        total_assets_under_management: fundStat.total_assets_under_management 
          ? parseFloat(fundStat.total_assets_under_management) 
          : 0,
        average_nav: fundStat.average_nav 
          ? parseFloat(fundStat.average_nav) 
          : 0,
        top_performing_fund: topFund.length > 0 ? topFund[0].name : null,
      },
      portfolio_summary: {
        total_portfolios: portfolioStat.total_portfolios || 0,
        total_portfolio_value: portfolioStat.total_portfolio_value 
          ? parseFloat(portfolioStat.total_portfolio_value) 
          : 0,
        average_performance: portfolioStat.average_performance 
          ? parseFloat(portfolioStat.average_performance) 
          : 0,
        best_performing_portfolio: bestPortfolio.length > 0 ? bestPortfolio[0].name : null,
      },
    };
  } catch (error) {
    console.error('Dashboard summary generation failed:', error);
    throw error;
  }
}
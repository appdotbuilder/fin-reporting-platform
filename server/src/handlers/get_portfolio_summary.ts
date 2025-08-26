import { db } from '../db';
import { portfoliosTable } from '../db/schema';
import { type PortfolioSummary } from '../schema';
import { count, sum, avg, desc, sql } from 'drizzle-orm';

export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  try {
    // Get total portfolios count
    const totalPortfoliosResult = await db.select({
      count: count()
    })
    .from(portfoliosTable)
    .execute();

    const totalPortfolios = totalPortfoliosResult[0]?.count || 0;

    // If no portfolios exist, return empty summary
    if (totalPortfolios === 0) {
      return {
        total_portfolios: 0,
        total_portfolio_value: 0,
        average_performance: 0,
        best_performing_portfolio: null,
      };
    }

    // Get aggregate data - total value and average performance
    const aggregateResult = await db.select({
      total_value: sum(portfoliosTable.total_value),
      avg_performance: avg(portfoliosTable.performance),
    })
    .from(portfoliosTable)
    .execute();

    const totalValue = aggregateResult[0]?.total_value || '0';
    const avgPerformance = aggregateResult[0]?.avg_performance || '0';

    // Get best performing portfolio
    const bestPerformingResult = await db.select({
      name: portfoliosTable.name,
    })
    .from(portfoliosTable)
    .orderBy(desc(portfoliosTable.performance))
    .limit(1)
    .execute();

    const bestPerformingPortfolio = bestPerformingResult[0]?.name || null;

    return {
      total_portfolios: totalPortfolios,
      total_portfolio_value: parseFloat(totalValue), // Convert numeric to number
      average_performance: parseFloat(avgPerformance), // Convert numeric to number
      best_performing_portfolio: bestPerformingPortfolio,
    };
  } catch (error) {
    console.error('Portfolio summary generation failed:', error);
    throw error;
  }
};
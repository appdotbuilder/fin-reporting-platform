import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { getPortfolioSummary } from '../handlers/get_portfolio_summary';

describe('getPortfolioSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no portfolios exist', async () => {
    const result = await getPortfolioSummary();

    expect(result.total_portfolios).toEqual(0);
    expect(result.total_portfolio_value).toEqual(0);
    expect(result.average_performance).toEqual(0);
    expect(result.best_performing_portfolio).toBeNull();
  });

  it('should return correct summary for single portfolio', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '50000',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.5000',
        total_assets: '1000000',
        management_fee: '0.0150',
      })
      .returning()
      .execute();

    await db.insert(portfoliosTable)
      .values({
        name: 'High Performance Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '75000.50',
        cash_balance: '5000.25',
        performance: '15.7500',
      })
      .execute();

    const result = await getPortfolioSummary();

    expect(result.total_portfolios).toEqual(1);
    expect(result.total_portfolio_value).toEqual(75000.50);
    expect(result.average_performance).toEqual(15.75);
    expect(result.best_performing_portfolio).toEqual('High Performance Portfolio');
  });

  it('should return correct summary for multiple portfolios', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '100000',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.5000',
        total_assets: '1000000',
        management_fee: '0.0150',
      })
      .returning()
      .execute();

    // Insert multiple portfolios with different values and performances
    await db.insert(portfoliosTable)
      .values([
        {
          name: 'Conservative Portfolio',
          investor_id: investor[0].id,
          fund_id: fund[0].id,
          total_value: '50000.00',
          cash_balance: '2000.00',
          performance: '5.2500',
        },
        {
          name: 'Aggressive Portfolio',
          investor_id: investor[0].id,
          fund_id: fund[0].id,
          total_value: '80000.75',
          cash_balance: '1500.50',
          performance: '18.7500',
        },
        {
          name: 'Balanced Portfolio',
          investor_id: investor[0].id,
          fund_id: fund[0].id,
          total_value: '65000.25',
          cash_balance: '3000.75',
          performance: '10.5000',
        },
      ])
      .execute();

    const result = await getPortfolioSummary();

    expect(result.total_portfolios).toEqual(3);
    expect(result.total_portfolio_value).toEqual(195001.00); // Sum of all portfolio values
    expect(result.average_performance).toBeCloseTo(11.5, 1); // Average of 5.25, 18.75, 10.5
    expect(result.best_performing_portfolio).toEqual('Aggressive Portfolio'); // Highest performance
  });

  it('should handle portfolios with negative performance', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '100000',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.5000',
        total_assets: '1000000',
        management_fee: '0.0150',
      })
      .returning()
      .execute();

    await db.insert(portfoliosTable)
      .values([
        {
          name: 'Loss Portfolio',
          investor_id: investor[0].id,
          fund_id: fund[0].id,
          total_value: '40000.00',
          cash_balance: '1000.00',
          performance: '-12.5000',
        },
        {
          name: 'Break Even Portfolio',
          investor_id: investor[0].id,
          fund_id: fund[0].id,
          total_value: '50000.00',
          cash_balance: '2000.00',
          performance: '0.0000',
        },
      ])
      .execute();

    const result = await getPortfolioSummary();

    expect(result.total_portfolios).toEqual(2);
    expect(result.total_portfolio_value).toEqual(90000.00);
    expect(result.average_performance).toEqual(-6.25); // Average of -12.5 and 0
    expect(result.best_performing_portfolio).toEqual('Break Even Portfolio'); // 0% is better than -12.5%
  });

  it('should return correct numeric types for all fields', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '50000',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.5000',
        total_assets: '1000000',
        management_fee: '0.0150',
      })
      .returning()
      .execute();

    await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '75000.50',
        cash_balance: '5000.25',
        performance: '15.7500',
      })
      .execute();

    const result = await getPortfolioSummary();

    // Verify correct types are returned
    expect(typeof result.total_portfolios).toBe('number');
    expect(typeof result.total_portfolio_value).toBe('number');
    expect(typeof result.average_performance).toBe('number');
    expect(result.best_performing_portfolio === null || typeof result.best_performing_portfolio === 'string').toBe(true);
  });

  it('should handle large portfolio values correctly', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'High Net Worth Investor',
        email: 'hnw@test.com',
        investor_type: 'institutional',
        total_invested: '10000000',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Large Fund',
        fund_type: 'mixed',
        inception_date: new Date(),
        nav: '500.2500',
        total_assets: '100000000',
        management_fee: '0.0075',
      })
      .returning()
      .execute();

    await db.insert(portfoliosTable)
      .values({
        name: 'Institutional Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '9876543.21',
        cash_balance: '123456.78',
        performance: '22.3456',
      })
      .execute();

    const result = await getPortfolioSummary();

    expect(result.total_portfolios).toEqual(1);
    expect(result.total_portfolio_value).toEqual(9876543.21);
    expect(result.average_performance).toEqual(22.3456);
    expect(result.best_performing_portfolio).toEqual('Institutional Portfolio');
  });
});
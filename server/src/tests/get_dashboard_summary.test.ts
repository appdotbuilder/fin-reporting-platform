import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable, portfoliosTable, investorsTable } from '../db/schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no data exists', async () => {
    const result = await getDashboardSummary();

    expect(result.fund_summary.total_funds).toEqual(0);
    expect(result.fund_summary.total_assets_under_management).toEqual(0);
    expect(result.fund_summary.average_nav).toEqual(0);
    expect(result.fund_summary.top_performing_fund).toBeNull();

    expect(result.portfolio_summary.total_portfolios).toEqual(0);
    expect(result.portfolio_summary.total_portfolio_value).toEqual(0);
    expect(result.portfolio_summary.average_performance).toEqual(0);
    expect(result.portfolio_summary.best_performing_portfolio).toBeNull();
  });

  it('should calculate fund summary with single fund', async () => {
    // Create a test fund
    await db.insert(fundsTable).values({
      name: 'Test Fund',
      fund_type: 'equity',
      inception_date: new Date('2023-01-01'),
      nav: '100.5000',
      total_assets: '1000000.00',
      management_fee: '0.0150',
    }).execute();

    const result = await getDashboardSummary();

    expect(result.fund_summary.total_funds).toEqual(1);
    expect(result.fund_summary.total_assets_under_management).toEqual(1000000);
    expect(result.fund_summary.average_nav).toEqual(100.5);
    expect(result.fund_summary.top_performing_fund).toEqual('Test Fund');
  });

  it('should calculate fund summary with multiple funds', async () => {
    // Create multiple test funds
    await db.insert(fundsTable).values([
      {
        name: 'Growth Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '150.2500',
        total_assets: '2000000.00',
        management_fee: '0.0150',
      },
      {
        name: 'Value Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-02-01'),
        nav: '95.7500',
        total_assets: '1500000.00',
        management_fee: '0.0125',
      },
      {
        name: 'Bond Fund',
        fund_type: 'fixed_income',
        inception_date: new Date('2023-03-01'),
        nav: '104.0000',
        total_assets: '800000.00',
        management_fee: '0.0075',
      },
    ]).execute();

    const result = await getDashboardSummary();

    expect(result.fund_summary.total_funds).toEqual(3);
    expect(result.fund_summary.total_assets_under_management).toEqual(4300000);
    expect(result.fund_summary.average_nav).toBeCloseTo(116.67, 2); // (150.25 + 95.75 + 104) / 3
    expect(result.fund_summary.top_performing_fund).toEqual('Growth Fund'); // Highest NAV
  });

  it('should calculate portfolio summary with single portfolio', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable).values({
      name: 'Test Investor',
      email: 'test@example.com',
      investor_type: 'individual',
      total_invested: '50000.00',
    }).returning().execute();

    const fund = await db.insert(fundsTable).values({
      name: 'Test Fund',
      fund_type: 'equity',
      inception_date: new Date('2023-01-01'),
      nav: '100.0000',
      total_assets: '1000000.00',
      management_fee: '0.0150',
    }).returning().execute();

    await db.insert(portfoliosTable).values({
      name: 'Test Portfolio',
      investor_id: investor[0].id,
      fund_id: fund[0].id,
      total_value: '75000.00',
      cash_balance: '5000.00',
      performance: '12.5000',
    }).execute();

    const result = await getDashboardSummary();

    expect(result.portfolio_summary.total_portfolios).toEqual(1);
    expect(result.portfolio_summary.total_portfolio_value).toEqual(75000);
    expect(result.portfolio_summary.average_performance).toEqual(12.5);
    expect(result.portfolio_summary.best_performing_portfolio).toEqual('Test Portfolio');
  });

  it('should calculate portfolio summary with multiple portfolios', async () => {
    // Create prerequisite data
    const investors = await db.insert(investorsTable).values([
      {
        name: 'Investor One',
        email: 'investor1@example.com',
        investor_type: 'individual',
        total_invested: '50000.00',
      },
      {
        name: 'Investor Two',
        email: 'investor2@example.com',
        investor_type: 'institutional',
        total_invested: '100000.00',
      },
    ]).returning().execute();

    const funds = await db.insert(fundsTable).values([
      {
        name: 'Growth Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '150.0000',
        total_assets: '2000000.00',
        management_fee: '0.0150',
      },
      {
        name: 'Value Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-02-01'),
        nav: '95.0000',
        total_assets: '1500000.00',
        management_fee: '0.0125',
      },
    ]).returning().execute();

    await db.insert(portfoliosTable).values([
      {
        name: 'High Performance Portfolio',
        investor_id: investors[0].id,
        fund_id: funds[0].id,
        total_value: '85000.00',
        cash_balance: '5000.00',
        performance: '18.7500',
      },
      {
        name: 'Conservative Portfolio',
        investor_id: investors[1].id,
        fund_id: funds[1].id,
        total_value: '120000.00',
        cash_balance: '10000.00',
        performance: '8.2500',
      },
      {
        name: 'Balanced Portfolio',
        investor_id: investors[0].id,
        fund_id: funds[0].id,
        total_value: '65000.00',
        cash_balance: '3000.00',
        performance: '15.0000',
      },
    ]).execute();

    const result = await getDashboardSummary();

    expect(result.portfolio_summary.total_portfolios).toEqual(3);
    expect(result.portfolio_summary.total_portfolio_value).toEqual(270000);
    expect(result.portfolio_summary.average_performance).toBeCloseTo(14.0, 1); // (18.75 + 8.25 + 15) / 3
    expect(result.portfolio_summary.best_performing_portfolio).toEqual('High Performance Portfolio'); // Highest performance
  });

  it('should handle mixed data scenario correctly', async () => {
    // Create funds and portfolios in same test
    const investors = await db.insert(investorsTable).values({
      name: 'Mixed Investor',
      email: 'mixed@example.com',
      investor_type: 'individual',
      total_invested: '75000.00',
    }).returning().execute();

    const funds = await db.insert(fundsTable).values([
      {
        name: 'Alpha Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '200.0000',
        total_assets: '5000000.00',
        management_fee: '0.0200',
      },
      {
        name: 'Beta Fund',
        fund_type: 'mixed',
        inception_date: new Date('2023-02-01'),
        nav: '110.0000',
        total_assets: '3000000.00',
        management_fee: '0.0150',
      },
    ]).returning().execute();

    await db.insert(portfoliosTable).values([
      {
        name: 'Alpha Portfolio',
        investor_id: investors[0].id,
        fund_id: funds[0].id,
        total_value: '150000.00',
        cash_balance: '10000.00',
        performance: '25.0000',
      },
      {
        name: 'Beta Portfolio',
        investor_id: investors[0].id,
        fund_id: funds[1].id,
        total_value: '80000.00',
        cash_balance: '5000.00',
        performance: '10.5000',
      },
    ]).execute();

    const result = await getDashboardSummary();

    // Verify fund summary
    expect(result.fund_summary.total_funds).toEqual(2);
    expect(result.fund_summary.total_assets_under_management).toEqual(8000000);
    expect(result.fund_summary.average_nav).toEqual(155); // (200 + 110) / 2
    expect(result.fund_summary.top_performing_fund).toEqual('Alpha Fund');

    // Verify portfolio summary
    expect(result.portfolio_summary.total_portfolios).toEqual(2);
    expect(result.portfolio_summary.total_portfolio_value).toEqual(230000);
    expect(result.portfolio_summary.average_performance).toEqual(17.75); // (25 + 10.5) / 2
    expect(result.portfolio_summary.best_performing_portfolio).toEqual('Alpha Portfolio');
  });

  it('should handle numeric type conversions correctly', async () => {
    // Create test data with specific numeric values to verify conversions
    const investor = await db.insert(investorsTable).values({
      name: 'Numeric Test Investor',
      email: 'numeric@example.com',
      investor_type: 'individual',
      total_invested: '50000.00',
    }).returning().execute();

    const fund = await db.insert(fundsTable).values({
      name: 'Numeric Fund',
      fund_type: 'equity',
      inception_date: new Date('2023-01-01'),
      nav: '123.4567',
      total_assets: '9876543.21',
      management_fee: '0.0175',
    }).returning().execute();

    await db.insert(portfoliosTable).values({
      name: 'Numeric Portfolio',
      investor_id: investor[0].id,
      fund_id: fund[0].id,
      total_value: '87654.32',
      cash_balance: '1234.56',
      performance: '13.7890',
    }).execute();

    const result = await getDashboardSummary();

    // Verify all numeric fields are properly converted to numbers
    expect(typeof result.fund_summary.total_assets_under_management).toBe('number');
    expect(result.fund_summary.total_assets_under_management).toEqual(9876543.21);
    expect(typeof result.fund_summary.average_nav).toBe('number');
    expect(result.fund_summary.average_nav).toEqual(123.4567);

    expect(typeof result.portfolio_summary.total_portfolio_value).toBe('number');
    expect(result.portfolio_summary.total_portfolio_value).toEqual(87654.32);
    expect(typeof result.portfolio_summary.average_performance).toBe('number');
    expect(result.portfolio_summary.average_performance).toEqual(13.789);
  });
});
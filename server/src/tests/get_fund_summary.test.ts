import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable, investorsTable, portfoliosTable } from '../db/schema';
import { getFundSummary } from '../handlers/get_fund_summary';

describe('getFundSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no funds exist', async () => {
    const result = await getFundSummary();

    expect(result.total_funds).toEqual(0);
    expect(result.total_assets_under_management).toEqual(0);
    expect(result.average_nav).toEqual(0);
    expect(result.top_performing_fund).toBeNull();
  });

  it('should calculate correct fund statistics', async () => {
    // Create test funds
    await db.insert(fundsTable).values([
      {
        name: 'Growth Fund',
        fund_type: 'equity',
        inception_date: new Date('2020-01-01'),
        nav: '25.50'.toString(),
        total_assets: '1000000.00'.toString(),
        management_fee: '0.0150'.toString(),
        description: 'High growth equity fund'
      },
      {
        name: 'Income Fund',
        fund_type: 'fixed_income',
        inception_date: new Date('2019-06-01'),
        nav: '15.25'.toString(),
        total_assets: '500000.00'.toString(),
        management_fee: '0.0100'.toString(),
        description: 'Conservative income fund'
      },
      {
        name: 'Mixed Fund',
        fund_type: 'mixed',
        inception_date: new Date('2021-03-01'),
        nav: '20.75'.toString(),
        total_assets: '750000.00'.toString(),
        management_fee: '0.0125'.toString(),
        description: 'Balanced mixed fund'
      }
    ]).execute();

    const result = await getFundSummary();

    expect(result.total_funds).toEqual(3);
    expect(result.total_assets_under_management).toEqual(2250000.00);
    expect(result.average_nav).toBeCloseTo(20.50, 2); // (25.50 + 15.25 + 20.75) / 3
    expect(typeof result.total_assets_under_management).toBe('number');
    expect(typeof result.average_nav).toBe('number');
  });

  it('should identify top performing fund based on portfolio performance', async () => {
    // Create test investor first
    const investorResult = await db.insert(investorsTable).values({
      name: 'Test Investor',
      email: 'test@example.com',
      investor_type: 'individual',
      total_invested: '50000.00'.toString(),
      phone: '555-0123',
      address: '123 Test St'
    }).returning().execute();

    const investorId = investorResult[0].id;

    // Create test funds
    const fundResults = await db.insert(fundsTable).values([
      {
        name: 'High Performer Fund',
        fund_type: 'equity',
        inception_date: new Date('2020-01-01'),
        nav: '30.00'.toString(),
        total_assets: '1000000.00'.toString(),
        management_fee: '0.0150'.toString(),
        description: 'Top performing fund'
      },
      {
        name: 'Medium Performer Fund',
        fund_type: 'mixed',
        inception_date: new Date('2019-06-01'),
        nav: '20.00'.toString(),
        total_assets: '500000.00'.toString(),
        management_fee: '0.0100'.toString(),
        description: 'Average performing fund'
      }
    ]).returning().execute();

    const highPerformerFundId = fundResults[0].id;
    const mediumPerformerFundId = fundResults[1].id;

    // Create portfolios with different performance levels
    await db.insert(portfoliosTable).values([
      {
        name: 'High Performance Portfolio 1',
        investor_id: investorId,
        fund_id: highPerformerFundId,
        total_value: '25000.00'.toString(),
        cash_balance: '1000.00'.toString(),
        performance: '15.50'.toString() // 15.50% performance
      },
      {
        name: 'High Performance Portfolio 2',
        investor_id: investorId,
        fund_id: highPerformerFundId,
        total_value: '30000.00'.toString(),
        cash_balance: '2000.00'.toString(),
        performance: '18.75'.toString() // 18.75% performance
      },
      {
        name: 'Medium Performance Portfolio',
        investor_id: investorId,
        fund_id: mediumPerformerFundId,
        total_value: '20000.00'.toString(),
        cash_balance: '500.00'.toString(),
        performance: '8.25'.toString() // 8.25% performance
      }
    ]).execute();

    const result = await getFundSummary();

    expect(result.total_funds).toEqual(2);
    expect(result.top_performing_fund).toEqual('High Performer Fund');
    // High Performer Fund avg: (15.50 + 18.75) / 2 = 17.125%
    // Medium Performer Fund avg: 8.25%
    // High Performer should be selected as top performing
  });

  it('should handle funds without portfolios correctly', async () => {
    // Create funds but no portfolios
    await db.insert(fundsTable).values([
      {
        name: 'Standalone Fund',
        fund_type: 'equity',
        inception_date: new Date('2020-01-01'),
        nav: '25.00'.toString(),
        total_assets: '1000000.00'.toString(),
        management_fee: '0.0150'.toString(),
        description: 'Fund without portfolios'
      }
    ]).execute();

    const result = await getFundSummary();

    expect(result.total_funds).toEqual(1);
    expect(result.total_assets_under_management).toEqual(1000000.00);
    expect(result.average_nav).toEqual(25.00);
    expect(result.top_performing_fund).toBeNull(); // No portfolios = no performance data
  });

  it('should handle mixed scenario with some funds having portfolios', async () => {
    // Create test investor
    const investorResult = await db.insert(investorsTable).values({
      name: 'Test Investor',
      email: 'mixed@example.com',
      investor_type: 'individual',
      total_invested: '75000.00'.toString()
    }).returning().execute();

    const investorId = investorResult[0].id;

    // Create multiple funds
    const fundResults = await db.insert(fundsTable).values([
      {
        name: 'Fund With Portfolios',
        fund_type: 'equity',
        inception_date: new Date('2020-01-01'),
        nav: '30.00'.toString(),
        total_assets: '2000000.00'.toString(),
        management_fee: '0.0150'.toString()
      },
      {
        name: 'Fund Without Portfolios',
        fund_type: 'fixed_income',
        inception_date: new Date('2019-06-01'),
        nav: '20.00'.toString(),
        total_assets: '1000000.00'.toString(),
        management_fee: '0.0100'.toString()
      }
    ]).returning().execute();

    // Create portfolio only for first fund
    await db.insert(portfoliosTable).values({
      name: 'Test Portfolio',
      investor_id: investorId,
      fund_id: fundResults[0].id,
      total_value: '50000.00'.toString(),
      cash_balance: '2000.00'.toString(),
      performance: '12.50'.toString()
    }).execute();

    const result = await getFundSummary();

    expect(result.total_funds).toEqual(2);
    expect(result.total_assets_under_management).toEqual(3000000.00);
    expect(result.average_nav).toEqual(25.00); // (30 + 20) / 2
    expect(result.top_performing_fund).toEqual('Fund With Portfolios');
  });

  it('should return correct numeric types', async () => {
    // Create a single fund for type verification
    await db.insert(fundsTable).values({
      name: 'Type Test Fund',
      fund_type: 'equity',
      inception_date: new Date('2020-01-01'),
      nav: '25.50'.toString(),
      total_assets: '1500000.00'.toString(),
      management_fee: '0.0150'.toString()
    }).execute();

    const result = await getFundSummary();

    expect(typeof result.total_funds).toBe('number');
    expect(typeof result.total_assets_under_management).toBe('number');
    expect(typeof result.average_nav).toBe('number');
    expect(result.total_funds).toEqual(1);
    expect(result.total_assets_under_management).toEqual(1500000.00);
    expect(result.average_nav).toEqual(25.50);
  });
});
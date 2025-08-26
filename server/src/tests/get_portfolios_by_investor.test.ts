import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable, fundsTable, portfoliosTable } from '../db/schema';
import { getPortfoliosByInvestor } from '../handlers/get_portfolios_by_investor';

// Test data
const testInvestor = {
  name: 'Test Investor',
  email: 'test@example.com',
  investor_type: 'individual' as const,
  total_invested: 100000,
  phone: '555-0123',
  address: '123 Test St'
};

const testInvestor2 = {
  name: 'Another Investor',
  email: 'another@example.com',
  investor_type: 'institutional' as const,
  total_invested: 500000,
  phone: '555-0456',
  address: '456 Another St'
};

const testFund = {
  name: 'Test Equity Fund',
  fund_type: 'equity' as const,
  inception_date: new Date('2020-01-01'),
  nav: 125.50,
  total_assets: 10000000,
  management_fee: 0.0125,
  description: 'A test equity fund'
};

describe('getPortfoliosByInvestor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return portfolios for a specific investor', async () => {
    // Create investor and fund
    const [investor] = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    // Create portfolios for the investor
    const portfolio1 = {
      name: 'Growth Portfolio',
      investor_id: investor.id,
      fund_id: fund.id,
      total_value: 150000,
      cash_balance: 5000,
      performance: 15.75
    };

    const portfolio2 = {
      name: 'Conservative Portfolio',
      investor_id: investor.id,
      fund_id: fund.id,
      total_value: 85000,
      cash_balance: 2500,
      performance: 8.25
    };

    await db.insert(portfoliosTable)
      .values([
        {
          ...portfolio1,
          total_value: portfolio1.total_value.toString(),
          cash_balance: portfolio1.cash_balance.toString(),
          performance: portfolio1.performance.toString()
        },
        {
          ...portfolio2,
          total_value: portfolio2.total_value.toString(),
          cash_balance: portfolio2.cash_balance.toString(),
          performance: portfolio2.performance.toString()
        }
      ])
      .execute();

    // Test the handler
    const result = await getPortfoliosByInvestor(investor.id);

    expect(result).toHaveLength(2);
    
    // Verify portfolio data and numeric conversions
    const growthPortfolio = result.find(p => p.name === 'Growth Portfolio');
    const conservativePortfolio = result.find(p => p.name === 'Conservative Portfolio');

    expect(growthPortfolio).toBeDefined();
    expect(growthPortfolio!.name).toEqual('Growth Portfolio');
    expect(growthPortfolio!.investor_id).toEqual(investor.id);
    expect(growthPortfolio!.fund_id).toEqual(fund.id);
    expect(growthPortfolio!.total_value).toEqual(150000);
    expect(growthPortfolio!.cash_balance).toEqual(5000);
    expect(growthPortfolio!.performance).toEqual(15.75);
    expect(typeof growthPortfolio!.total_value).toBe('number');
    expect(typeof growthPortfolio!.cash_balance).toBe('number');
    expect(typeof growthPortfolio!.performance).toBe('number');

    expect(conservativePortfolio).toBeDefined();
    expect(conservativePortfolio!.name).toEqual('Conservative Portfolio');
    expect(conservativePortfolio!.total_value).toEqual(85000);
    expect(conservativePortfolio!.cash_balance).toEqual(2500);
    expect(conservativePortfolio!.performance).toEqual(8.25);
  });

  it('should return empty array when investor has no portfolios', async () => {
    // Create investor without portfolios
    const [investor] = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const result = await getPortfoliosByInvestor(investor.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent investor', async () => {
    const result = await getPortfoliosByInvestor(99999);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return portfolios for the specified investor', async () => {
    // Create two investors and a fund
    const [investor1] = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const [investor2] = await db.insert(investorsTable)
      .values({
        ...testInvestor2,
        total_invested: testInvestor2.total_invested.toString()
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    // Create portfolios for both investors
    await db.insert(portfoliosTable)
      .values([
        {
          name: 'Investor 1 Portfolio',
          investor_id: investor1.id,
          fund_id: fund.id,
          total_value: '100000',
          cash_balance: '5000',
          performance: '12.5'
        },
        {
          name: 'Investor 2 Portfolio A',
          investor_id: investor2.id,
          fund_id: fund.id,
          total_value: '200000',
          cash_balance: '10000',
          performance: '18.75'
        },
        {
          name: 'Investor 2 Portfolio B',
          investor_id: investor2.id,
          fund_id: fund.id,
          total_value: '150000',
          cash_balance: '7500',
          performance: '14.25'
        }
      ])
      .execute();

    // Test that we only get portfolios for investor1
    const investor1Portfolios = await getPortfoliosByInvestor(investor1.id);
    expect(investor1Portfolios).toHaveLength(1);
    expect(investor1Portfolios[0].name).toEqual('Investor 1 Portfolio');
    expect(investor1Portfolios[0].investor_id).toEqual(investor1.id);

    // Test that we only get portfolios for investor2
    const investor2Portfolios = await getPortfoliosByInvestor(investor2.id);
    expect(investor2Portfolios).toHaveLength(2);
    expect(investor2Portfolios.every(p => p.investor_id === investor2.id)).toBe(true);
    
    const portfolioNames = investor2Portfolios.map(p => p.name).sort();
    expect(portfolioNames).toEqual(['Investor 2 Portfolio A', 'Investor 2 Portfolio B']);
  });

  it('should handle portfolios with various numeric precision correctly', async () => {
    // Create investor and fund
    const [investor] = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    // Create portfolio with precise decimal values that match DB precision
    // total_value and cash_balance: numeric(15, 2) - 2 decimal places
    // performance: numeric(8, 4) - 4 decimal places
    const portfolio = {
      name: 'Precision Test Portfolio',
      investor_id: investor.id,
      fund_id: fund.id,
      total_value: 123456.79, // 2 decimal places
      cash_balance: 9876.54,  // 2 decimal places
      performance: -2.3456    // 4 decimal places
    };

    await db.insert(portfoliosTable)
      .values({
        ...portfolio,
        total_value: portfolio.total_value.toString(),
        cash_balance: portfolio.cash_balance.toString(),
        performance: portfolio.performance.toString()
      })
      .execute();

    const result = await getPortfoliosByInvestor(investor.id);

    expect(result).toHaveLength(1);
    expect(result[0].total_value).toEqual(123456.79);
    expect(result[0].cash_balance).toEqual(9876.54);
    expect(result[0].performance).toEqual(-2.3456);
    expect(typeof result[0].total_value).toBe('number');
    expect(typeof result[0].cash_balance).toBe('number');
    expect(typeof result[0].performance).toBe('number');
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { getPortfolios } from '../handlers/get_portfolios';
import { type CreateInvestorInput, type CreateFundInput, type CreatePortfolioInput } from '../schema';

// Test data
const testInvestor: CreateInvestorInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  investor_type: 'individual',
  total_invested: 50000,
  phone: '555-0123',
  address: '123 Main St'
};

const testFund: CreateFundInput = {
  name: 'Growth Fund A',
  fund_type: 'equity',
  inception_date: new Date('2020-01-01'),
  nav: 125.75,
  total_assets: 1000000,
  management_fee: 0.0075,
  description: 'High growth equity fund'
};

const testPortfolio: CreatePortfolioInput = {
  name: 'Conservative Portfolio',
  investor_id: 1, // Will be set after creating investor
  fund_id: 1, // Will be set after creating fund
  total_value: 75000.50,
  cash_balance: 5000.25,
  performance: 8.75
};

describe('getPortfolios', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no portfolios exist', async () => {
    const result = await getPortfolios();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all portfolios with correct field types', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        name: testInvestor.name,
        email: testInvestor.email,
        investor_type: testInvestor.investor_type,
        total_invested: testInvestor.total_invested.toString(),
        phone: testInvestor.phone,
        address: testInvestor.address
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    // Create portfolio
    await db.insert(portfoliosTable)
      .values({
        name: testPortfolio.name,
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .execute();

    const result = await getPortfolios();

    expect(result).toHaveLength(1);
    const portfolio = result[0];

    // Verify basic fields
    expect(portfolio.name).toEqual('Conservative Portfolio');
    expect(portfolio.investor_id).toEqual(investorResult[0].id);
    expect(portfolio.fund_id).toEqual(fundResult[0].id);
    expect(portfolio.id).toBeDefined();
    expect(portfolio.created_at).toBeInstanceOf(Date);
    expect(portfolio.updated_at).toBeInstanceOf(Date);

    // Verify numeric conversions
    expect(typeof portfolio.total_value).toBe('number');
    expect(typeof portfolio.cash_balance).toBe('number');
    expect(typeof portfolio.performance).toBe('number');
    expect(portfolio.total_value).toEqual(75000.50);
    expect(portfolio.cash_balance).toEqual(5000.25);
    expect(portfolio.performance).toEqual(8.75);
  });

  it('should return multiple portfolios correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        name: testInvestor.name,
        email: testInvestor.email,
        investor_type: testInvestor.investor_type,
        total_invested: testInvestor.total_invested.toString(),
        phone: testInvestor.phone,
        address: testInvestor.address
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    // Create multiple portfolios
    const portfolios = [
      {
        name: 'Portfolio One',
        total_value: 100000,
        cash_balance: 10000,
        performance: 12.5
      },
      {
        name: 'Portfolio Two',
        total_value: 250000.75,
        cash_balance: 15000.50,
        performance: -2.25
      },
      {
        name: 'Portfolio Three',
        total_value: 75000,
        cash_balance: 2500,
        performance: 5.0
      }
    ];

    for (const portfolio of portfolios) {
      await db.insert(portfoliosTable)
        .values({
          name: portfolio.name,
          investor_id: investorResult[0].id,
          fund_id: fundResult[0].id,
          total_value: portfolio.total_value.toString(),
          cash_balance: portfolio.cash_balance.toString(),
          performance: portfolio.performance.toString()
        })
        .execute();
    }

    const result = await getPortfolios();

    expect(result).toHaveLength(3);
    
    // Verify all portfolios have correct types
    result.forEach(portfolio => {
      expect(typeof portfolio.total_value).toBe('number');
      expect(typeof portfolio.cash_balance).toBe('number');
      expect(typeof portfolio.performance).toBe('number');
      expect(portfolio.created_at).toBeInstanceOf(Date);
      expect(portfolio.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific values
    const portfolioOne = result.find(p => p.name === 'Portfolio One');
    expect(portfolioOne?.total_value).toEqual(100000);
    expect(portfolioOne?.cash_balance).toEqual(10000);
    expect(portfolioOne?.performance).toEqual(12.5);

    const portfolioTwo = result.find(p => p.name === 'Portfolio Two');
    expect(portfolioTwo?.total_value).toEqual(250000.75);
    expect(portfolioTwo?.cash_balance).toEqual(15000.50);
    expect(portfolioTwo?.performance).toEqual(-2.25);
  });

  it('should handle portfolios with negative performance correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        name: testInvestor.name,
        email: testInvestor.email,
        investor_type: testInvestor.investor_type,
        total_invested: testInvestor.total_invested.toString(),
        phone: testInvestor.phone,
        address: testInvestor.address
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    // Create portfolio with negative performance
    await db.insert(portfoliosTable)
      .values({
        name: 'Declining Portfolio',
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: '45000.00',
        cash_balance: '3000.00',
        performance: '-15.75' // Negative performance
      })
      .execute();

    const result = await getPortfolios();

    expect(result).toHaveLength(1);
    const portfolio = result[0];
    
    expect(portfolio.name).toEqual('Declining Portfolio');
    expect(portfolio.performance).toEqual(-15.75);
    expect(typeof portfolio.performance).toBe('number');
  });

  it('should handle portfolios with zero values correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        name: testInvestor.name,
        email: testInvestor.email,
        investor_type: testInvestor.investor_type,
        total_invested: testInvestor.total_invested.toString(),
        phone: testInvestor.phone,
        address: testInvestor.address
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    // Create portfolio with zero values
    await db.insert(portfoliosTable)
      .values({
        name: 'Empty Portfolio',
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: '0.00',
        cash_balance: '0.00',
        performance: '0.00'
      })
      .execute();

    const result = await getPortfolios();

    expect(result).toHaveLength(1);
    const portfolio = result[0];
    
    expect(portfolio.name).toEqual('Empty Portfolio');
    expect(portfolio.total_value).toEqual(0);
    expect(portfolio.cash_balance).toEqual(0);
    expect(portfolio.performance).toEqual(0);
    expect(typeof portfolio.total_value).toBe('number');
    expect(typeof portfolio.cash_balance).toBe('number');
    expect(typeof portfolio.performance).toBe('number');
  });
});
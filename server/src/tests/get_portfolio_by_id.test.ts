import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type CreateInvestorInput, type CreateFundInput, type CreatePortfolioInput } from '../schema';
import { getPortfolioById } from '../handlers/get_portfolio_by_id';

describe('getPortfolioById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return portfolio by id', async () => {
    // Create prerequisite data first
    const investorData: CreateInvestorInput = {
      name: 'Test Investor',
      email: 'investor@example.com',
      investor_type: 'individual',
      total_invested: 50000,
      phone: '+1234567890',
      address: '123 Main St'
    };

    const fundData: CreateFundInput = {
      name: 'Growth Fund',
      fund_type: 'equity',
      inception_date: new Date('2020-01-01'),
      nav: 125.50,
      total_assets: 1000000,
      management_fee: 0.015,
      description: 'A growth-focused equity fund'
    };

    // Insert investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...investorData,
        total_invested: investorData.total_invested.toString()
      })
      .returning()
      .execute();

    // Insert fund
    const fundResult = await db.insert(fundsTable)
      .values({
        ...fundData,
        nav: fundData.nav.toString(),
        total_assets: fundData.total_assets.toString(),
        management_fee: fundData.management_fee.toString()
      })
      .returning()
      .execute();

    // Insert portfolio
    const portfolioData: CreatePortfolioInput = {
      name: 'Test Portfolio',
      investor_id: investorResult[0].id,
      fund_id: fundResult[0].id,
      total_value: 75000,
      cash_balance: 5000,
      performance: 12.5
    };

    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        ...portfolioData,
        total_value: portfolioData.total_value.toString(),
        cash_balance: portfolioData.cash_balance.toString(),
        performance: portfolioData.performance.toString()
      })
      .returning()
      .execute();

    const result = await getPortfolioById(portfolioResult[0].id);

    // Verify portfolio fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(portfolioResult[0].id);
    expect(result!.name).toEqual('Test Portfolio');
    expect(result!.investor_id).toEqual(investorResult[0].id);
    expect(result!.fund_id).toEqual(fundResult[0].id);
    expect(result!.total_value).toEqual(75000);
    expect(result!.cash_balance).toEqual(5000);
    expect(result!.performance).toEqual(12.5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result!.total_value).toBe('number');
    expect(typeof result!.cash_balance).toBe('number');
    expect(typeof result!.performance).toBe('number');
  });

  it('should return null for non-existent portfolio', async () => {
    const result = await getPortfolioById(999);
    expect(result).toBeNull();
  });

  it('should handle negative id', async () => {
    const result = await getPortfolioById(-1);
    expect(result).toBeNull();
  });

  it('should handle decimal values correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        name: 'Decimal Investor',
        email: 'decimal@example.com',
        investor_type: 'institutional',
        total_invested: '100000.00',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        name: 'Decimal Fund',
        fund_type: 'mixed',
        inception_date: new Date('2019-06-15'),
        nav: '98.7654',
        total_assets: '2500000.00',
        management_fee: '0.0125',
        description: null
      })
      .returning()
      .execute();

    // Insert portfolio with decimal values
    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        name: 'Decimal Portfolio',
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: '123456.78',
        cash_balance: '9876.54',
        performance: '-3.2105'
      })
      .returning()
      .execute();

    const result = await getPortfolioById(portfolioResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.total_value).toEqual(123456.78);
    expect(result!.cash_balance).toEqual(9876.54);
    expect(result!.performance).toEqual(-3.2105);

    // Verify precision is maintained
    expect(typeof result!.total_value).toBe('number');
    expect(typeof result!.cash_balance).toBe('number');
    expect(typeof result!.performance).toBe('number');
  });

  it('should handle zero values correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        name: 'Zero Investor',
        email: 'zero@example.com',
        investor_type: 'individual',
        total_invested: '0.00',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        name: 'Zero Fund',
        fund_type: 'equity',
        inception_date: new Date('2021-01-01'),
        nav: '1.0000',
        total_assets: '0.00',
        management_fee: '0.0000',
        description: null
      })
      .returning()
      .execute();

    // Insert portfolio with zero values
    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        name: 'Zero Portfolio',
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: '0.00',
        cash_balance: '0.00',
        performance: '0.0000'
      })
      .returning()
      .execute();

    const result = await getPortfolioById(portfolioResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.total_value).toEqual(0);
    expect(result!.cash_balance).toEqual(0);
    expect(result!.performance).toEqual(0);
  });
});
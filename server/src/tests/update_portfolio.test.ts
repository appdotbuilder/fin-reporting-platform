import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type UpdatePortfolioInput, type CreateInvestorInput, type CreateFundInput } from '../schema';
import { updatePortfolio } from '../handlers/update_portfolio';
import { eq } from 'drizzle-orm';

describe('updatePortfolio', () => {
  let testInvestorId: number;
  let testFundId: number;
  let testPortfolioId: number;
  let secondInvestorId: number;
  let secondFundId: number;

  beforeEach(async () => {
    await createDB();

    // Create test investor
    const investor: CreateInvestorInput = {
      name: 'Test Investor',
      email: 'test@example.com',
      investor_type: 'individual',
      total_invested: 50000,
      phone: '+1234567890',
      address: '123 Test St'
    };

    const investorResult = await db.insert(investorsTable)
      .values({
        ...investor,
        total_invested: investor.total_invested.toString()
      })
      .returning()
      .execute();

    testInvestorId = investorResult[0].id;

    // Create second investor for testing updates
    const secondInvestor: CreateInvestorInput = {
      name: 'Second Investor',
      email: 'second@example.com',
      investor_type: 'institutional',
      total_invested: 100000,
      phone: '+0987654321',
      address: '456 Update St'
    };

    const secondInvestorResult = await db.insert(investorsTable)
      .values({
        ...secondInvestor,
        total_invested: secondInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    secondInvestorId = secondInvestorResult[0].id;

    // Create test fund
    const fund: CreateFundInput = {
      name: 'Test Fund',
      fund_type: 'equity',
      inception_date: new Date('2020-01-01'),
      nav: 100.50,
      total_assets: 1000000,
      management_fee: 0.02,
      description: 'A test fund'
    };

    const fundResult = await db.insert(fundsTable)
      .values({
        ...fund,
        nav: fund.nav.toString(),
        total_assets: fund.total_assets.toString(),
        management_fee: fund.management_fee.toString()
      })
      .returning()
      .execute();

    testFundId = fundResult[0].id;

    // Create second fund for testing updates
    const secondFund: CreateFundInput = {
      name: 'Updated Fund',
      fund_type: 'fixed_income',
      inception_date: new Date('2021-01-01'),
      nav: 105.75,
      total_assets: 2000000,
      management_fee: 0.015,
      description: 'An updated test fund'
    };

    const secondFundResult = await db.insert(fundsTable)
      .values({
        ...secondFund,
        nav: secondFund.nav.toString(),
        total_assets: secondFund.total_assets.toString(),
        management_fee: secondFund.management_fee.toString()
      })
      .returning()
      .execute();

    secondFundId = secondFundResult[0].id;

    // Create test portfolio
    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: testInvestorId,
        fund_id: testFundId,
        total_value: '25000.50',
        cash_balance: '5000.25',
        performance: '7.5'
      })
      .returning()
      .execute();

    testPortfolioId = portfolioResult[0].id;
  });

  afterEach(resetDB);

  it('should update portfolio name', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      name: 'Updated Portfolio Name'
    };

    const result = await updatePortfolio(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(testPortfolioId);
    expect(result!.name).toBe('Updated Portfolio Name');
    expect(result!.investor_id).toBe(testInvestorId);
    expect(result!.fund_id).toBe(testFundId);
    expect(result!.total_value).toBe(25000.50);
    expect(result!.cash_balance).toBe(5000.25);
    expect(result!.performance).toBe(7.5);
    expect(typeof result!.total_value).toBe('number');
    expect(typeof result!.cash_balance).toBe('number');
    expect(typeof result!.performance).toBe('number');
  });

  it('should update numeric fields', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      total_value: 35000.75,
      cash_balance: 7500.50,
      performance: 12.25
    };

    const result = await updatePortfolio(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(testPortfolioId);
    expect(result!.name).toBe('Test Portfolio'); // Unchanged
    expect(result!.total_value).toBe(35000.75);
    expect(result!.cash_balance).toBe(7500.50);
    expect(result!.performance).toBe(12.25);
    expect(typeof result!.total_value).toBe('number');
    expect(typeof result!.cash_balance).toBe('number');
    expect(typeof result!.performance).toBe('number');
  });

  it('should update foreign key relationships', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      investor_id: secondInvestorId,
      fund_id: secondFundId
    };

    const result = await updatePortfolio(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(testPortfolioId);
    expect(result!.investor_id).toBe(secondInvestorId);
    expect(result!.fund_id).toBe(secondFundId);
    expect(result!.name).toBe('Test Portfolio'); // Unchanged
  });

  it('should update multiple fields simultaneously', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      name: 'Multi-Update Portfolio',
      total_value: 45000.99,
      cash_balance: 10000.01,
      performance: 15.75,
      investor_id: secondInvestorId
    };

    const result = await updatePortfolio(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(testPortfolioId);
    expect(result!.name).toBe('Multi-Update Portfolio');
    expect(result!.total_value).toBe(45000.99);
    expect(result!.cash_balance).toBe(10000.01);
    expect(result!.performance).toBe(15.75);
    expect(result!.investor_id).toBe(secondInvestorId);
    expect(result!.fund_id).toBe(testFundId); // Unchanged
  });

  it('should update portfolio in database', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      name: 'Database Update Test',
      total_value: 30000
    };

    await updatePortfolio(updateInput);

    // Verify update was persisted to database
    const portfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, testPortfolioId))
      .execute();

    expect(portfolios).toHaveLength(1);
    expect(portfolios[0].name).toBe('Database Update Test');
    expect(parseFloat(portfolios[0].total_value)).toBe(30000);
    expect(portfolios[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, testPortfolioId))
      .execute();

    const originalUpdatedAt = originalPortfolio[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      name: 'Timestamp Test'
    };

    const result = await updatePortfolio(updateInput);

    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should return null for non-existent portfolio', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: 99999,
      name: 'Non-existent Portfolio'
    };

    const result = await updatePortfolio(updateInput);

    expect(result).toBeNull();
  });

  it('should handle zero values correctly', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      total_value: 0,
      cash_balance: 0,
      performance: 0
    };

    const result = await updatePortfolio(updateInput);

    expect(result).not.toBeNull();
    expect(result!.total_value).toBe(0);
    expect(result!.cash_balance).toBe(0);
    expect(result!.performance).toBe(0);
  });

  it('should handle negative performance values', async () => {
    const updateInput: UpdatePortfolioInput = {
      id: testPortfolioId,
      performance: -5.25
    };

    const result = await updatePortfolio(updateInput);

    expect(result).not.toBeNull();
    expect(result!.performance).toBe(-5.25);
    expect(typeof result!.performance).toBe('number');
  });
});
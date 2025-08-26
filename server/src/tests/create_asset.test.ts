import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type CreateAssetInput } from '../schema';
import { createAsset } from '../handlers/create_asset';
import { eq } from 'drizzle-orm';

describe('createAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create required prerequisite data
  const createPrerequisiteData = async () => {
    // Create investor
    const investorResult = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '50000.00'
      })
      .returning()
      .execute();

    // Create fund
    const fundResult = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '100.5000',
        total_assets: '1000000.00',
        management_fee: '0.0200'
      })
      .returning()
      .execute();

    // Create portfolio
    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: '25000.00',
        cash_balance: '5000.00',
        performance: '8.5000'
      })
      .returning()
      .execute();

    return {
      investor: investorResult[0],
      fund: fundResult[0],
      portfolio: portfolioResult[0]
    };
  };

  const testInput: CreateAssetInput = {
    portfolio_id: 1, // Will be updated in tests
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_type: 'stock',
    quantity: 100,
    unit_price: 150.50,
    market_value: 15050.00,
    cost_basis: 14800.00,
    purchase_date: new Date('2023-06-15')
  };

  it('should create an asset', async () => {
    const { portfolio } = await createPrerequisiteData();
    const input = { ...testInput, portfolio_id: portfolio.id };

    const result = await createAsset(input);

    // Basic field validation
    expect(result.portfolio_id).toEqual(portfolio.id);
    expect(result.symbol).toEqual('AAPL');
    expect(result.name).toEqual('Apple Inc.');
    expect(result.asset_type).toEqual('stock');
    expect(result.quantity).toEqual(100);
    expect(result.unit_price).toEqual(150.50);
    expect(result.market_value).toEqual(15050.00);
    expect(result.cost_basis).toEqual(14800.00);
    expect(result.purchase_date).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.unit_price).toBe('number');
    expect(typeof result.market_value).toBe('number');
    expect(typeof result.cost_basis).toBe('number');
  });

  it('should save asset to database', async () => {
    const { portfolio } = await createPrerequisiteData();
    const input = { ...testInput, portfolio_id: portfolio.id };

    const result = await createAsset(input);

    // Query using proper drizzle syntax
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].symbol).toEqual('AAPL');
    expect(assets[0].name).toEqual('Apple Inc.');
    expect(assets[0].asset_type).toEqual('stock');
    expect(parseFloat(assets[0].quantity)).toEqual(100);
    expect(parseFloat(assets[0].unit_price)).toEqual(150.50);
    expect(parseFloat(assets[0].market_value)).toEqual(15050.00);
    expect(parseFloat(assets[0].cost_basis)).toEqual(14800.00);
    expect(assets[0].purchase_date).toBeInstanceOf(Date);
    expect(assets[0].created_at).toBeInstanceOf(Date);
    expect(assets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update portfolio total_value when adding asset', async () => {
    const { portfolio } = await createPrerequisiteData();
    const originalTotalValue = parseFloat(portfolio.total_value);
    const input = { ...testInput, portfolio_id: portfolio.id };

    await createAsset(input);

    // Verify portfolio total_value was updated
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio.id))
      .execute();

    expect(updatedPortfolio).toHaveLength(1);
    const newTotalValue = parseFloat(updatedPortfolio[0].total_value);
    expect(newTotalValue).toEqual(originalTotalValue + input.market_value);
    expect(updatedPortfolio[0].updated_at).toBeInstanceOf(Date);
    
    // Verify the updated_at timestamp changed
    expect(updatedPortfolio[0].updated_at.getTime()).toBeGreaterThan(portfolio.updated_at.getTime());
  });

  it('should throw error when portfolio does not exist', async () => {
    const input = { ...testInput, portfolio_id: 999 }; // Non-existent portfolio ID

    await expect(createAsset(input)).rejects.toThrow(/Portfolio with ID 999 not found/i);
  });

  it('should handle different asset types correctly', async () => {
    const { portfolio } = await createPrerequisiteData();
    const bondInput: CreateAssetInput = {
      portfolio_id: portfolio.id,
      symbol: 'BOND123',
      name: 'Corporate Bond',
      asset_type: 'bond',
      quantity: 50,
      unit_price: 1000.00,
      market_value: 50000.00,
      cost_basis: 49500.00,
      purchase_date: new Date('2023-05-01')
    };

    const result = await createAsset(bondInput);

    expect(result.asset_type).toEqual('bond');
    expect(result.symbol).toEqual('BOND123');
    expect(result.name).toEqual('Corporate Bond');
    expect(result.quantity).toEqual(50);
    expect(result.unit_price).toEqual(1000.00);
  });

  it('should handle fractional quantities correctly', async () => {
    const { portfolio } = await createPrerequisiteData();
    const fractionalInput: CreateAssetInput = {
      portfolio_id: portfolio.id,
      symbol: 'ETF123',
      name: 'Test ETF',
      asset_type: 'etf',
      quantity: 15.567834, // High precision fractional quantity
      unit_price: 125.7899,
      market_value: 1958.45,
      cost_basis: 1950.00,
      purchase_date: new Date('2023-07-01')
    };

    const result = await createAsset(fractionalInput);

    expect(result.quantity).toEqual(15.567834);
    expect(result.unit_price).toEqual(125.7899);
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.unit_price).toBe('number');
  });

  it('should handle multiple assets in same portfolio', async () => {
    const { portfolio } = await createPrerequisiteData();
    const originalTotalValue = parseFloat(portfolio.total_value);

    const asset1Input = { ...testInput, portfolio_id: portfolio.id, symbol: 'AAPL' };
    const asset2Input = { ...testInput, portfolio_id: portfolio.id, symbol: 'GOOGL', name: 'Alphabet Inc.', market_value: 8500.00 };

    const result1 = await createAsset(asset1Input);
    const result2 = await createAsset(asset2Input);

    // Verify both assets were created
    expect(result1.symbol).toEqual('AAPL');
    expect(result2.symbol).toEqual('GOOGL');

    // Verify portfolio total_value reflects both additions
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio.id))
      .execute();

    const finalTotalValue = parseFloat(updatedPortfolio[0].total_value);
    expect(finalTotalValue).toEqual(originalTotalValue + asset1Input.market_value + asset2Input.market_value);
  });
});
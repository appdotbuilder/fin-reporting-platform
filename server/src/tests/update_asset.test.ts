import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, portfoliosTable, fundsTable, investorsTable } from '../db/schema';
import { type UpdateAssetInput, type CreateAssetInput } from '../schema';
import { updateAsset } from '../handlers/update_asset';
import { eq } from 'drizzle-orm';

// Test data
const testInvestor = {
  name: 'Test Investor',
  email: 'investor@test.com',
  investor_type: 'individual' as const,
  total_invested: 100000,
  phone: '+1234567890',
  address: '123 Test St'
};

const testFund = {
  name: 'Test Fund',
  fund_type: 'equity' as const,
  inception_date: new Date('2023-01-01'),
  nav: 100.0,
  total_assets: 1000000,
  management_fee: 0.015,
  description: 'Test fund'
};

const testPortfolio = {
  name: 'Test Portfolio',
  investor_id: 1,
  fund_id: 1,
  total_value: 50000,
  cash_balance: 10000,
  performance: 5.5
};

const testAsset: CreateAssetInput = {
  portfolio_id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  asset_type: 'stock',
  quantity: 100,
  unit_price: 150.00,
  market_value: 15000.00,
  cost_basis: 14000.00,
  purchase_date: new Date('2023-06-01')
};

describe('updateAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test dependencies
  const createTestDependencies = async () => {
    // Create investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    // Create fund
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    // Create portfolio
    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        ...testPortfolio,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .returning()
      .execute();

    // Create asset
    const assetResult = await db.insert(assetsTable)
      .values({
        ...testAsset,
        quantity: testAsset.quantity.toString(),
        unit_price: testAsset.unit_price.toString(),
        market_value: testAsset.market_value.toString(),
        cost_basis: testAsset.cost_basis.toString()
      })
      .returning()
      .execute();

    return {
      investor: investorResult[0],
      fund: fundResult[0],
      portfolio: portfolioResult[0],
      asset: assetResult[0]
    };
  };

  it('should update asset basic fields', async () => {
    const { asset } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 50,
      unit_price: 2800.00
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toBe(asset.id);
    expect(result!.symbol).toBe('GOOGL');
    expect(result!.name).toBe('Alphabet Inc.');
    expect(result!.quantity).toBe(50);
    expect(result!.unit_price).toBe(2800.00);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify unchanged fields remain the same
    expect(result!.asset_type).toBe(testAsset.asset_type);
    expect(result!.market_value).toBe(testAsset.market_value);
    expect(result!.cost_basis).toBe(testAsset.cost_basis);
  });

  it('should update market_value and recalculate portfolio total_value', async () => {
    const { asset, portfolio } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      market_value: 18000.00
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeTruthy();
    expect(result!.market_value).toBe(18000.00);

    // Verify portfolio total_value was updated
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio.id))
      .execute();

    expect(parseFloat(updatedPortfolio[0].total_value)).toBe(18000.00);
    expect(updatedPortfolio[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle portfolio change and update both portfolios', async () => {
    const { asset } = await createTestDependencies();

    // Create second portfolio
    const secondPortfolioResult = await db.insert(portfoliosTable)
      .values({
        name: 'Second Portfolio',
        investor_id: 1,
        fund_id: 1,
        total_value: '25000',
        cash_balance: '5000',
        performance: '3.2'
      })
      .returning()
      .execute();

    const secondPortfolio = secondPortfolioResult[0];

    // Add an existing asset to the second portfolio
    await db.insert(assetsTable)
      .values({
        portfolio_id: secondPortfolio.id,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        asset_type: 'stock',
        quantity: '10',
        unit_price: '2500.00',
        market_value: '25000.00',
        cost_basis: '24000.00',
        purchase_date: new Date('2023-05-01')
      })
      .execute();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      portfolio_id: secondPortfolio.id
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeTruthy();
    expect(result!.portfolio_id).toBe(secondPortfolio.id);

    // Verify old portfolio total_value was updated (should be 0 now)
    const oldPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, 1))
      .execute();

    expect(parseFloat(oldPortfolio[0].total_value)).toBe(0);

    // Verify new portfolio total_value was updated (existing asset + moved asset)
    const newPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, secondPortfolio.id))
      .execute();

    expect(parseFloat(newPortfolio[0].total_value)).toBe(40000.00); // 25000 + 15000
  });

  it('should update multiple fields simultaneously', async () => {
    const { asset } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      asset_type: 'stock',
      quantity: 75,
      unit_price: 300.00,
      market_value: 22500.00,
      cost_basis: 20000.00,
      purchase_date: new Date('2023-07-01')
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeTruthy();
    expect(result!.symbol).toBe('MSFT');
    expect(result!.name).toBe('Microsoft Corporation');
    expect(result!.asset_type).toBe('stock');
    expect(result!.quantity).toBe(75);
    expect(result!.unit_price).toBe(300.00);
    expect(result!.market_value).toBe(22500.00);
    expect(result!.cost_basis).toBe(20000.00);
    expect(result!.purchase_date.toISOString()).toBe(new Date('2023-07-01').toISOString());

    // Verify portfolio total_value was updated
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, 1))
      .execute();

    expect(parseFloat(updatedPortfolio[0].total_value)).toBe(22500.00);
  });

  it('should return null for non-existent asset', async () => {
    await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: 999,
      symbol: 'NONEXISTENT'
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error for invalid portfolio reference', async () => {
    const { asset } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      portfolio_id: 999
    };

    expect(updateAsset(updateInput)).rejects.toThrow(/Portfolio with ID 999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const { asset } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      quantity: 200
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeTruthy();
    expect(result!.quantity).toBe(200);

    // Verify other fields unchanged
    expect(result!.symbol).toBe(testAsset.symbol);
    expect(result!.name).toBe(testAsset.name);
    expect(result!.unit_price).toBe(testAsset.unit_price);
    expect(result!.market_value).toBe(testAsset.market_value);
  });

  it('should save updated asset to database', async () => {
    const { asset } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      symbol: 'TSLA',
      market_value: 20000.00
    };

    await updateAsset(updateInput);

    // Verify changes persisted to database
    const savedAsset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset.id))
      .execute();

    expect(savedAsset).toHaveLength(1);
    expect(savedAsset[0].symbol).toBe('TSLA');
    expect(parseFloat(savedAsset[0].market_value)).toBe(20000.00);
    expect(savedAsset[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric field conversions correctly', async () => {
    const { asset } = await createTestDependencies();

    const updateInput: UpdateAssetInput = {
      id: asset.id,
      quantity: 123.456789,
      unit_price: 1234.5678,
      market_value: 152839.47,
      cost_basis: 150000.00
    };

    const result = await updateAsset(updateInput);

    expect(result).toBeTruthy();
    expect(typeof result!.quantity).toBe('number');
    expect(typeof result!.unit_price).toBe('number');
    expect(typeof result!.market_value).toBe('number');
    expect(typeof result!.cost_basis).toBe('number');

    expect(result!.quantity).toBe(123.456789);
    expect(result!.unit_price).toBe(1234.5678);
    expect(result!.market_value).toBe(152839.47);
    expect(result!.cost_basis).toBe(150000.00);
  });
});
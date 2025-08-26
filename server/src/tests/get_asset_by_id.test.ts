import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type CreateAssetInput, type CreatePortfolioInput, type CreateInvestorInput, type CreateFundInput } from '../schema';
import { getAssetById } from '../handlers/get_asset_by_id';
import { eq } from 'drizzle-orm';

// Test data
const testInvestor: CreateInvestorInput = {
  name: 'Test Investor',
  email: 'test@example.com',
  investor_type: 'individual',
  total_invested: 50000.00,
  phone: '+1-555-0123',
  address: '123 Main St'
};

const testFund: CreateFundInput = {
  name: 'Test Fund',
  fund_type: 'equity',
  inception_date: new Date('2023-01-01'),
  nav: 100.50,
  total_assets: 1000000.00,
  management_fee: 0.75,
  description: 'Test fund description'
};

const testPortfolio: CreatePortfolioInput = {
  name: 'Test Portfolio',
  investor_id: 1, // Will be set after creating investor
  fund_id: 1, // Will be set after creating fund
  total_value: 25000.00,
  cash_balance: 5000.00,
  performance: 12.5
};

const testAsset: CreateAssetInput = {
  portfolio_id: 1, // Will be set after creating portfolio
  symbol: 'AAPL',
  name: 'Apple Inc.',
  asset_type: 'stock',
  quantity: 100.5,
  unit_price: 150.25,
  market_value: 15100.13, // 2 decimal places max
  cost_basis: 14500.00,
  purchase_date: new Date('2023-06-15')
};

describe('getAssetById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return asset when found', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        ...testPortfolio,
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .returning()
      .execute();

    const assetResult = await db.insert(assetsTable)
      .values({
        ...testAsset,
        portfolio_id: portfolioResult[0].id,
        quantity: testAsset.quantity.toString(),
        unit_price: testAsset.unit_price.toString(),
        market_value: testAsset.market_value.toString(),
        cost_basis: testAsset.cost_basis.toString()
      })
      .returning()
      .execute();

    const result = await getAssetById(assetResult[0].id);

    // Verify the asset was returned with correct data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(assetResult[0].id);
    expect(result!.symbol).toEqual('AAPL');
    expect(result!.name).toEqual('Apple Inc.');
    expect(result!.asset_type).toEqual('stock');
    expect(result!.portfolio_id).toEqual(portfolioResult[0].id);
    
    // Verify numeric conversions
    expect(typeof result!.quantity).toBe('number');
    expect(result!.quantity).toEqual(100.5);
    expect(typeof result!.unit_price).toBe('number');
    expect(result!.unit_price).toEqual(150.25);
    expect(typeof result!.market_value).toBe('number');
    expect(result!.market_value).toEqual(15100.13);
    expect(typeof result!.cost_basis).toBe('number');
    expect(result!.cost_basis).toEqual(14500.00);
    
    // Verify dates
    expect(result!.purchase_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when asset not found', async () => {
    const result = await getAssetById(99999);
    expect(result).toBeNull();
  });

  it('should handle different asset types correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        ...testPortfolio,
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .returning()
      .execute();

    // Test bond asset type
    const bondAsset = {
      ...testAsset,
      portfolio_id: portfolioResult[0].id,
      symbol: 'GOVT',
      name: 'Government Bond',
      asset_type: 'bond' as const
    };

    const bondResult = await db.insert(assetsTable)
      .values({
        ...bondAsset,
        quantity: bondAsset.quantity.toString(),
        unit_price: bondAsset.unit_price.toString(),
        market_value: bondAsset.market_value.toString(),
        cost_basis: bondAsset.cost_basis.toString()
      })
      .returning()
      .execute();

    const result = await getAssetById(bondResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.asset_type).toEqual('bond');
    expect(result!.symbol).toEqual('GOVT');
    expect(result!.name).toEqual('Government Bond');
  });

  it('should verify asset exists in database after retrieval', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        ...testPortfolio,
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .returning()
      .execute();

    const assetResult = await db.insert(assetsTable)
      .values({
        ...testAsset,
        portfolio_id: portfolioResult[0].id,
        quantity: testAsset.quantity.toString(),
        unit_price: testAsset.unit_price.toString(),
        market_value: testAsset.market_value.toString(),
        cost_basis: testAsset.cost_basis.toString()
      })
      .returning()
      .execute();

    const handlerResult = await getAssetById(assetResult[0].id);

    // Verify by directly querying the database
    const dbAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetResult[0].id))
      .execute();

    expect(dbAssets).toHaveLength(1);
    expect(handlerResult).not.toBeNull();
    expect(handlerResult!.id).toEqual(dbAssets[0].id);
    expect(handlerResult!.symbol).toEqual(dbAssets[0].symbol);
    
    // Verify the raw database values are strings (before conversion)
    expect(typeof dbAssets[0].quantity).toBe('string');
    expect(typeof dbAssets[0].unit_price).toBe('string');
    expect(typeof dbAssets[0].market_value).toBe('string');
    expect(typeof dbAssets[0].cost_basis).toBe('string');
    
    // But handler result should have converted them to numbers
    expect(typeof handlerResult!.quantity).toBe('number');
    expect(typeof handlerResult!.unit_price).toBe('number');
    expect(typeof handlerResult!.market_value).toBe('number');
    expect(typeof handlerResult!.cost_basis).toBe('number');
  });

  it('should handle fractional quantities correctly', async () => {
    // Create prerequisite data
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioResult = await db.insert(portfoliosTable)
      .values({
        ...testPortfolio,
        investor_id: investorResult[0].id,
        fund_id: fundResult[0].id,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .returning()
      .execute();

    // Test with very precise fractional quantities (respecting database precision limits)
    const fractionalAsset = {
      ...testAsset,
      portfolio_id: portfolioResult[0].id,
      quantity: 25.123456, // scale 6 - OK
      unit_price: 99.9999,  // scale 4 - OK
      market_value: 2512.34, // scale 2 - must be 2 decimal places
      cost_basis: 2500.00   // scale 2 - OK
    };

    const assetResult = await db.insert(assetsTable)
      .values({
        ...fractionalAsset,
        quantity: fractionalAsset.quantity.toString(),
        unit_price: fractionalAsset.unit_price.toString(),
        market_value: fractionalAsset.market_value.toString(),
        cost_basis: fractionalAsset.cost_basis.toString()
      })
      .returning()
      .execute();

    const result = await getAssetById(assetResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.quantity).toEqual(25.123456);
    expect(result!.unit_price).toEqual(99.9999);
    expect(result!.market_value).toEqual(2512.34);
    expect(result!.cost_basis).toEqual(2500.00);
  });
});
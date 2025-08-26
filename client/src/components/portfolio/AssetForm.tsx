import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, AlertCircle, CheckCircle, Calendar, Info } from 'lucide-react';
import type { CreateAssetInput, Portfolio } from '../../../../server/src/schema';

interface AssetFormProps {
  onSuccess?: () => void;
}

function AssetForm({ onSuccess }: AssetFormProps) {
  const [formData, setFormData] = useState<CreateAssetInput>({
    portfolio_id: 0,
    symbol: '',
    name: '',
    asset_type: 'stock',
    quantity: 0,
    unit_price: 0,
    market_value: 0,
    cost_basis: 0,
    purchase_date: new Date(),
  });
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPortfolios = useCallback(async () => {
    try {
      setIsLoadingPortfolios(true);
      const result = await trpc.getPortfolios.query();
      setPortfolios(result || []);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockPortfolios: Portfolio[] = [
        {
          id: 1,
          name: 'Growth-Focused Portfolio',
          investor_id: 1,
          fund_id: 1,
          total_value: 2500000,
          cash_balance: 125000,
          performance: 12.5,
          created_at: new Date('2023-02-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          name: 'Conservative Income Portfolio',
          investor_id: 2,
          fund_id: 2,
          total_value: 750000,
          cash_balance: 75000,
          performance: 6.8,
          created_at: new Date('2023-03-15'),
          updated_at: new Date('2024-01-10'),
        },
        {
          id: 3,
          name: 'Balanced Investment Portfolio',
          investor_id: 1,
          fund_id: 1,
          total_value: 1800000,
          cash_balance: 90000,
          performance: 9.2,
          created_at: new Date('2023-05-01'),
          updated_at: new Date('2024-01-05'),
        },
      ];
      setPortfolios(mockPortfolios);
    } finally {
      setIsLoadingPortfolios(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  // Auto-calculate market value when quantity or unit price changes
  useEffect(() => {
    if (formData.quantity > 0 && formData.unit_price > 0) {
      const calculatedMarketValue = formData.quantity * formData.unit_price;
      setFormData((prev: CreateAssetInput) => ({
        ...prev,
        market_value: calculatedMarketValue
      }));
    }
  }, [formData.quantity, formData.unit_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.portfolio_id === 0) {
      setError('Please select a portfolio');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (formData.unit_price <= 0) {
      setError('Unit price must be greater than 0');
      return;
    }

    if (formData.market_value <= 0) {
      setError('Market value must be greater than 0');
      return;
    }

    if (formData.cost_basis <= 0) {
      setError('Cost basis must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createAsset.mutate(formData);
      setSuccess('Asset added successfully!');
      
      // Reset form
      setFormData({
        portfolio_id: 0,
        symbol: '',
        name: '',
        asset_type: 'stock',
        quantity: 0,
        unit_price: 0,
        market_value: 0,
        cost_basis: 0,
        purchase_date: new Date(),
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to create asset:', error);
      setError('Failed to add asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    setFormData((prev: CreateAssetInput) => ({ 
      ...prev, 
      purchase_date: date 
    }));
  };

  const assetTypes = [
    { value: 'stock', label: 'Stock', description: 'Individual company shares' },
    { value: 'bond', label: 'Bond', description: 'Debt securities' },
    { value: 'etf', label: 'ETF', description: 'Exchange-traded funds' },
    { value: 'mutual_fund', label: 'Mutual Fund', description: 'Pooled investment funds' },
    { value: 'commodity', label: 'Commodity', description: 'Physical goods (gold, oil, etc.)' },
    { value: 'real_estate', label: 'Real Estate', description: 'Property investments' },
    { value: 'alternative', label: 'Alternative', description: 'Other investment types' },
  ];

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Asset Added Successfully!</h3>
            <p className="text-green-600">The asset has been added to the portfolio.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Portfolio Selection */}
        <div className="space-y-2">
          <Label htmlFor="portfolio_id" className="text-sm font-medium">
            Portfolio *
          </Label>
          {isLoadingPortfolios ? (
            <div className="h-10 bg-slate-200 animate-pulse rounded-md"></div>
          ) : (
            <Select
              value={formData.portfolio_id === 0 ? '' : formData.portfolio_id.toString()}
              onValueChange={(value) =>
                setFormData((prev: CreateAssetInput) => ({ 
                  ...prev, 
                  portfolio_id: parseInt(value) 
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio: Portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                    <div>
                      <div className="font-medium">{portfolio.name}</div>
                      <div className="text-xs text-slate-500">
                        Total Value: ${portfolio.total_value.toLocaleString()}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {portfolios.length === 0 && !isLoadingPortfolios && (
            <p className="text-xs text-amber-600">
              No portfolios available. Please create a portfolio first.
            </p>
          )}
        </div>

        {/* Asset Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-sm font-medium">
              Symbol *
            </Label>
            <Input
              id="symbol"
              placeholder="AAPL, GOOGL, etc."
              value={formData.symbol}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateAssetInput) => ({ ...prev, symbol: e.target.value.toUpperCase() }))
              }
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset_type" className="text-sm font-medium">
              Asset Type *
            </Label>
            <Select
              value={formData.asset_type}
              onValueChange={(value) =>
                setFormData((prev: CreateAssetInput) => ({ 
                  ...prev, 
                  asset_type: value as CreateAssetInput['asset_type']
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-slate-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Asset Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Asset Name *
          </Label>
          <Input
            id="name"
            placeholder="Full name of the asset (e.g., Apple Inc.)"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAssetInput) => ({ ...prev, name: e.target.value }))
            }
            required
            className="w-full"
          />
        </div>

        {/* Quantity and Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity *
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100"
              value={formData.quantity || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateAssetInput) => ({ 
                  ...prev, 
                  quantity: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price" className="text-sm font-medium">
              Unit Price *
            </Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="150.00"
              value={formData.unit_price || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateAssetInput) => ({ 
                  ...prev, 
                  unit_price: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
          </div>
        </div>

        {/* Market Value and Cost Basis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="market_value" className="text-sm font-medium">
              Market Value *
            </Label>
            <Input
              id="market_value"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="15000.00"
              value={formData.market_value || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateAssetInput) => ({ 
                  ...prev, 
                  market_value: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Auto-calculated from quantity × unit price
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_basis" className="text-sm font-medium">
              Cost Basis *
            </Label>
            <Input
              id="cost_basis"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="14000.00"
              value={formData.cost_basis || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateAssetInput) => ({ 
                  ...prev, 
                  cost_basis: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Original purchase price including fees
            </p>
          </div>
        </div>

        {/* Purchase Date */}
        <div className="space-y-2">
          <Label htmlFor="purchase_date" className="text-sm font-medium">
            Purchase Date *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              id="purchase_date"
              type="date"
              value={formatDateForInput(formData.purchase_date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
              required
              className="w-full pl-10"
            />
          </div>
        </div>

        {/* Asset Summary */}
        {formData.market_value > 0 && formData.cost_basis > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-3 text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Asset Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Total Investment:</span>
                    <span className="font-medium">
                      ${(formData.quantity * formData.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Cost Basis:</span>
                    <span className="font-medium">
                      ${formData.cost_basis.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Value:</span>
                    <span className="font-medium">
                      ${formData.market_value.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Unrealized Gain/Loss:</span>
                    <span className={`font-medium ${
                      formData.market_value >= formData.cost_basis ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formData.market_value >= formData.cost_basis ? '+' : ''}
                      ${(formData.market_value - formData.cost_basis).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Return %:</span>
                    <span className={`font-medium ${
                      formData.market_value >= formData.cost_basis ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formData.cost_basis > 0 
                        ? `${((formData.market_value - formData.cost_basis) / formData.cost_basis * 100).toFixed(2)}%`
                        : '0.00%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                portfolio_id: 0,
                symbol: '',
                name: '',
                asset_type: 'stock',
                quantity: 0,
                unit_price: 0,
                market_value: 0,
                cost_basis: 0,
                purchase_date: new Date(),
              });
              setError(null);
            }}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || portfolios.length === 0}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Add Asset
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AssetForm;
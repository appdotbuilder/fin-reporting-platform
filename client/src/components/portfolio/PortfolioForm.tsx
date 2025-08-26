import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import type { CreatePortfolioInput, Investor, Fund } from '../../../../server/src/schema';

interface PortfolioFormProps {
  onSuccess?: () => void;
}

function PortfolioForm({ onSuccess }: PortfolioFormProps) {
  const [formData, setFormData] = useState<CreatePortfolioInput>({
    name: '',
    investor_id: 0,
    fund_id: 0,
    total_value: 0,
    cash_balance: 0,
    performance: 0,
  });
  
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [investorsResult, fundsResult] = await Promise.all([
        trpc.getInvestors.query(),
        trpc.getFunds.query()
      ]);
      setInvestors(investorsResult || []);
      setFunds(fundsResult || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockInvestors: Investor[] = [
        {
          id: 1,
          name: 'Johnson Family Trust',
          email: 'contact@johnsontrust.com',
          investor_type: 'institutional',
          total_invested: 5000000,
          phone: '+1 (555) 123-4567',
          address: '123 Wealth Avenue, New York, NY 10001',
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2024-01-10'),
        },
        {
          id: 2,
          name: 'Sarah Mitchell',
          email: 'sarah.mitchell@email.com',
          investor_type: 'individual',
          total_invested: 750000,
          phone: '+1 (555) 987-6543',
          address: '456 Investment Lane, Boston, MA 02101',
          created_at: new Date('2023-02-20'),
          updated_at: new Date('2023-12-15'),
        },
      ];
      
      const mockFunds: Fund[] = [
        {
          id: 1,
          name: 'Growth Equity Fund',
          fund_type: 'equity',
          inception_date: new Date('2023-01-15'),
          nav: 125.45,
          total_assets: 850000000,
          management_fee: 1.5,
          description: 'A diversified equity fund focused on growth opportunities.',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          name: 'Conservative Bond Fund',
          fund_type: 'fixed_income',
          inception_date: new Date('2023-03-01'),
          nav: 102.75,
          total_assets: 650000000,
          management_fee: 0.8,
          description: 'A stable income fund investing in high-grade bonds.',
          created_at: new Date('2023-02-15'),
          updated_at: new Date('2024-01-01'),
        },
      ];
      
      setInvestors(mockInvestors);
      setFunds(mockFunds);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.investor_id === 0) {
      setError('Please select an investor');
      return;
    }

    if (formData.fund_id === 0) {
      setError('Please select a fund');
      return;
    }

    if (formData.total_value < 0) {
      setError('Total value cannot be negative');
      return;
    }

    if (formData.cash_balance < 0) {
      setError('Cash balance cannot be negative');
      return;
    }

    if (formData.cash_balance > formData.total_value) {
      setError('Cash balance cannot exceed total portfolio value');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createPortfolio.mutate(formData);
      setSuccess('Portfolio created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        investor_id: 0,
        fund_id: 0,
        total_value: 0,
        cash_balance: 0,
        performance: 0,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      setError('Failed to create portfolio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Portfolio Created Successfully!</h3>
            <p className="text-green-600">The portfolio has been set up for the investor.</p>
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
        {/* Portfolio Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Portfolio Name *
          </Label>
          <Input
            id="name"
            placeholder="Enter portfolio name (e.g., Conservative Growth Portfolio)"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreatePortfolioInput) => ({ ...prev, name: e.target.value }))
            }
            required
            className="w-full"
          />
        </div>

        {/* Investor and Fund Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="investor_id" className="text-sm font-medium">
              Investor *
            </Label>
            {isLoadingData ? (
              <div className="h-10 bg-slate-200 animate-pulse rounded-md"></div>
            ) : (
              <Select
                value={formData.investor_id === 0 ? '' : formData.investor_id.toString()}
                onValueChange={(value) =>
                  setFormData((prev: CreatePortfolioInput) => ({ 
                    ...prev, 
                    investor_id: parseInt(value) 
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an investor" />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((investor: Investor) => (
                    <SelectItem key={investor.id} value={investor.id.toString()}>
                      <div>
                        <div className="font-medium">{investor.name}</div>
                        <div className="text-xs text-slate-500">
                          {investor.investor_type} • {investor.email}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {investors.length === 0 && !isLoadingData && (
              <p className="text-xs text-amber-600">
                No investors available. Please create an investor first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fund_id" className="text-sm font-medium">
              Fund *
            </Label>
            {isLoadingData ? (
              <div className="h-10 bg-slate-200 animate-pulse rounded-md"></div>
            ) : (
              <Select
                value={formData.fund_id === 0 ? '' : formData.fund_id.toString()}
                onValueChange={(value) =>
                  setFormData((prev: CreatePortfolioInput) => ({ 
                    ...prev, 
                    fund_id: parseInt(value) 
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a fund" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((fund: Fund) => (
                    <SelectItem key={fund.id} value={fund.id.toString()}>
                      <div>
                        <div className="font-medium">{fund.name}</div>
                        <div className="text-xs text-slate-500">
                          {fund.fund_type.replace('_', ' ')} • NAV: ${fund.nav.toFixed(2)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {funds.length === 0 && !isLoadingData && (
              <p className="text-xs text-amber-600">
                No funds available. Please create a fund first.
              </p>
            )}
          </div>
        </div>

        {/* Financial Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_value" className="text-sm font-medium">
              Initial Total Value *
            </Label>
            <Input
              id="total_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.total_value || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePortfolioInput) => ({ 
                  ...prev, 
                  total_value: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Initial total value of the portfolio
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cash_balance" className="text-sm font-medium">
              Initial Cash Balance *
            </Label>
            <Input
              id="cash_balance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.cash_balance || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePortfolioInput) => ({ 
                  ...prev, 
                  cash_balance: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Cash portion of the portfolio
            </p>
          </div>
        </div>

        {/* Performance */}
        <div className="space-y-2">
          <Label htmlFor="performance" className="text-sm font-medium">
            Initial Performance (%) *
          </Label>
          <Input
            id="performance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.performance || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreatePortfolioInput) => ({ 
                ...prev, 
                performance: parseFloat(e.target.value) || 0 
              }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Initial performance percentage (can be negative)
          </p>
        </div>

        {/* Portfolio Allocation Preview */}
        {formData.total_value > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-3 text-blue-800">Portfolio Allocation Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cash Allocation:</span>
                  <span className="font-medium">
                    {((formData.cash_balance / formData.total_value) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Invested Assets:</span>
                  <span className="font-medium">
                    {(100 - (formData.cash_balance / formData.total_value) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(formData.cash_balance / formData.total_value) * 100}%` }}
                  ></div>
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
                name: '',
                investor_id: 0,
                fund_id: 0,
                total_value: 0,
                cash_balance: 0,
                performance: 0,
              });
              setError(null);
            }}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || investors.length === 0 || funds.length === 0}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Portfolio
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PortfolioForm;
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, AlertCircle, CheckCircle, Calendar, Info } from 'lucide-react';
import type { CreateFundInput } from '../../../../server/src/schema';

interface FundFormProps {
  onSuccess?: () => void;
}

function FundForm({ onSuccess }: FundFormProps) {
  const [formData, setFormData] = useState<CreateFundInput>({
    name: '',
    fund_type: 'equity',
    inception_date: new Date(),
    nav: 100,
    total_assets: 0,
    management_fee: 1.0,
    description: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.nav <= 0) {
      setError('NAV must be greater than 0');
      return;
    }

    if (formData.total_assets < 0) {
      setError('Total assets cannot be negative');
      return;
    }

    if (formData.management_fee < 0) {
      setError('Management fee cannot be negative');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createFund.mutate(formData);
      setSuccess('Fund created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: 100,
        total_assets: 0,
        management_fee: 1.0,
        description: null,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to create fund:', error);
      setError('Failed to create fund. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    setFormData((prev: CreateFundInput) => ({ 
      ...prev, 
      inception_date: date 
    }));
  };

  const fundTypes = [
    { value: 'equity', label: 'Equity Fund', description: 'Invests primarily in stocks and equity securities' },
    { value: 'fixed_income', label: 'Fixed Income Fund', description: 'Focuses on bonds and fixed-income securities' },
    { value: 'mixed', label: 'Mixed Fund', description: 'Balanced portfolio of stocks and bonds' },
    { value: 'alternative', label: 'Alternative Fund', description: 'Alternative investments like REITs, commodities' },
  ];

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Fund Created Successfully!</h3>
            <p className="text-green-600">The fund has been added to your portfolio.</p>
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
        {/* Fund Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Fund Name *
          </Label>
          <Input
            id="name"
            placeholder="Enter fund name (e.g., Growth Equity Fund)"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateFundInput) => ({ ...prev, name: e.target.value }))
            }
            required
            className="w-full"
          />
        </div>

        {/* Fund Type */}
        <div className="space-y-2">
          <Label htmlFor="fund_type" className="text-sm font-medium">
            Fund Type *
          </Label>
          <Select
            value={formData.fund_type}
            onValueChange={(value) =>
              setFormData((prev: CreateFundInput) => ({ 
                ...prev, 
                fund_type: value as CreateFundInput['fund_type']
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fundTypes.map((type) => (
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

        {/* Inception Date */}
        <div className="space-y-2">
          <Label htmlFor="inception_date" className="text-sm font-medium">
            Inception Date *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              id="inception_date"
              type="date"
              value={formatDateForInput(formData.inception_date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
              required
              className="w-full pl-10"
            />
          </div>
          <p className="text-xs text-slate-500">
            The date when the fund was established
          </p>
        </div>

        {/* NAV and Total Assets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nav" className="text-sm font-medium">
              Initial NAV (Net Asset Value) *
            </Label>
            <Input
              id="nav"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              value={formData.nav || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateFundInput) => ({ 
                  ...prev, 
                  nav: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Usually starts at $100 per share
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_assets" className="text-sm font-medium">
              Initial Total Assets *
            </Label>
            <Input
              id="total_assets"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.total_assets || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateFundInput) => ({ 
                  ...prev, 
                  total_assets: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Initial assets under management
            </p>
          </div>
        </div>

        {/* Management Fee */}
        <div className="space-y-2">
          <Label htmlFor="management_fee" className="text-sm font-medium">
            Management Fee (%) *
          </Label>
          <Input
            id="management_fee"
            type="number"
            step="0.01"
            min="0"
            max="10"
            placeholder="1.00"
            value={formData.management_fee || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateFundInput) => ({ 
                ...prev, 
                management_fee: parseFloat(e.target.value) || 0 
              }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Annual management fee as a percentage (typically 0.5% - 2.5%)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Fund Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the fund's investment strategy and objectives..."
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateFundInput) => ({ 
                ...prev, 
                description: e.target.value || null 
              }))
            }
            rows={4}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Provide details about the fund's investment strategy (optional)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                fund_type: 'equity',
                inception_date: new Date(),
                nav: 100,
                total_assets: 0,
                management_fee: 1.0,
                description: null,
              });
              setError(null);
            }}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Fund
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Fund Type Guide */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium">Fund Types Overview</h4>
          </div>
          <div className="grid gap-3">
            {fundTypes.map((type) => (
              <div key={type.value} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-slate-400 mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium text-sm text-slate-900">{type.label}</div>
                  <div className="text-xs text-slate-600">{type.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FundForm;
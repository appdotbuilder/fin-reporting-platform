import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, AlertCircle, CheckCircle, User, Building } from 'lucide-react';
import type { CreateInvestorInput } from '../../../../server/src/schema';

interface InvestorFormProps {
  onSuccess?: () => void;
}

function InvestorForm({ onSuccess }: InvestorFormProps) {
  const [formData, setFormData] = useState<CreateInvestorInput>({
    name: '',
    email: '',
    investor_type: 'individual',
    total_invested: 0,
    phone: null,
    address: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.total_invested < 0) {
      setError('Total invested cannot be negative');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createInvestor.mutate(formData);
      setSuccess('Investor registered successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        investor_type: 'individual',
        total_invested: 0,
        phone: null,
        address: null,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to create investor:', error);
      setError('Failed to register investor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const investorTypes = [
    { value: 'individual', label: 'Individual Investor', description: 'Private individuals investing personal funds', icon: User },
    { value: 'institutional', label: 'Institutional Investor', description: 'Organizations, pensions, endowments', icon: Building },
  ];

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Investor Registered Successfully!</h3>
            <p className="text-green-600">The investor has been added to your directory.</p>
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
        {/* Investor Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name / Organization Name *
          </Label>
          <Input
            id="name"
            placeholder="Enter investor name or organization name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestorInput) => ({ ...prev, name: e.target.value }))
            }
            required
            className="w-full"
          />
        </div>

        {/* Investor Type */}
        <div className="space-y-2">
          <Label htmlFor="investor_type" className="text-sm font-medium">
            Investor Type *
          </Label>
          <Select
            value={formData.investor_type}
            onValueChange={(value) =>
              setFormData((prev: CreateInvestorInput) => ({ 
                ...prev, 
                investor_type: value as CreateInvestorInput['investor_type']
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {investorTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-slate-500">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="investor@example.com"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateInvestorInput) => ({ ...prev, email: e.target.value }))
              }
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateInvestorInput) => ({ 
                  ...prev, 
                  phone: e.target.value || null 
                }))
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Address
          </Label>
          <Textarea
            id="address"
            placeholder="Enter complete mailing address..."
            value={formData.address || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateInvestorInput) => ({ 
                ...prev, 
                address: e.target.value || null 
              }))
            }
            rows={3}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Complete mailing address for correspondence (optional)
          </p>
        </div>

        {/* Total Invested */}
        <div className="space-y-2">
          <Label htmlFor="total_invested" className="text-sm font-medium">
            Initial Investment Amount *
          </Label>
          <Input
            id="total_invested"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.total_invested || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvestorInput) => ({ 
                ...prev, 
                total_invested: parseFloat(e.target.value) || 0 
              }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Enter the initial investment amount or 0 for new investors
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
                email: '',
                investor_type: 'individual',
                total_invested: 0,
                phone: null,
                address: null,
              });
              setError(null);
            }}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Registering...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Register Investor
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Investor Type Guide */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h4 className="text-sm font-medium mb-4">Investor Types</h4>
          <div className="grid gap-3">
            {investorTypes.map((type) => (
              <div key={type.value} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <type.icon className="w-4 h-4 text-slate-600 mt-1" />
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

export default InvestorForm;
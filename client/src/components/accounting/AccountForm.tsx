import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import type { CreateAccountInput } from '../../../../server/src/schema';

interface AccountFormProps {
  onSuccess?: () => void;
}

function AccountForm({ onSuccess }: AccountFormProps) {
  const [formData, setFormData] = useState<CreateAccountInput>({
    name: '',
    account_number: '',
    account_type: 'asset',
    balance: 0,
    description: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createAccount.mutate(formData);
      setSuccess('Account created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        account_number: '',
        account_type: 'asset',
        balance: 0,
        description: null,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to create account:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const accountTypes = [
    { value: 'asset', label: 'Asset', description: 'Resources owned by the business' },
    { value: 'liability', label: 'Liability', description: 'Debts and obligations' },
    { value: 'equity', label: 'Equity', description: 'Owner\'s interest in the business' },
    { value: 'revenue', label: 'Revenue', description: 'Income from business operations' },
    { value: 'expense', label: 'Expense', description: 'Costs of business operations' },
  ];

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Account Created Successfully!</h3>
            <p className="text-green-600">The account has been added to your chart of accounts.</p>
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
        {/* Account Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Account Name *
          </Label>
          <Input
            id="name"
            placeholder="Enter account name (e.g., Cash, Accounts Receivable)"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAccountInput) => ({ ...prev, name: e.target.value }))
            }
            required
            className="w-full"
          />
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="account_number" className="text-sm font-medium">
            Account Number *
          </Label>
          <Input
            id="account_number"
            placeholder="Enter account number (e.g., 1000, 2000)"
            value={formData.account_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAccountInput) => ({ ...prev, account_number: e.target.value }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Use a unique identifier for this account
          </p>
        </div>

        {/* Account Type */}
        <div className="space-y-2">
          <Label htmlFor="account_type" className="text-sm font-medium">
            Account Type *
          </Label>
          <Select
            value={formData.account_type}
            onValueChange={(value) =>
              setFormData((prev: CreateAccountInput) => ({ 
                ...prev, 
                account_type: value as CreateAccountInput['account_type']
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.map((type) => (
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

        {/* Initial Balance */}
        <div className="space-y-2">
          <Label htmlFor="balance" className="text-sm font-medium">
            Initial Balance *
          </Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.balance}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAccountInput) => ({ 
                ...prev, 
                balance: parseFloat(e.target.value) || 0 
              }))
            }
            required
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Enter the starting balance for this account
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Optional description for this account..."
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateAccountInput) => ({ 
                ...prev, 
                description: e.target.value || null 
              }))
            }
            rows={3}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Provide additional details about this account (optional)
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
                account_number: '',
                account_type: 'asset',
                balance: 0,
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
                Create Account
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Account Type Guide */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h4 className="text-sm font-medium mb-4">Account Type Guide</h4>
          <div className="grid gap-3">
            {accountTypes.map((type) => (
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

export default AccountForm;
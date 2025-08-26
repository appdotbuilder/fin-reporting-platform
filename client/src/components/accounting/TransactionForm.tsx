import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Save, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import type { CreateTransactionInput, Account } from '../../../../server/src/schema';

interface TransactionFormProps {
  onSuccess?: () => void;
}

function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [formData, setFormData] = useState<CreateTransactionInput>({
    account_id: 0,
    transaction_type: 'debit',
    amount: 0,
    description: null,
    transaction_date: new Date(),
    reference_number: null,
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoadingAccounts(true);
      const result = await trpc.getAccounts.query();
      setAccounts(result || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockAccounts: Account[] = [
        {
          id: 1,
          name: 'Cash and Cash Equivalents',
          account_number: '1001',
          account_type: 'asset',
          balance: 500000,
          description: 'Primary operating cash accounts',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 2,
          name: 'Management Fee Revenue',
          account_number: '4001',
          account_type: 'revenue',
          balance: 250000,
          description: 'Management fees collected',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 3,
          name: 'Operating Expenses',
          account_number: '5001',
          account_type: 'expense',
          balance: 75000,
          description: 'General business operating expenses',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];
      setAccounts(mockAccounts);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.account_id === 0) {
      setError('Please select an account');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createTransaction.mutate(formData);
      setSuccess('Transaction recorded successfully!');
      
      // Reset form
      setFormData({
        account_id: 0,
        transaction_type: 'debit',
        amount: 0,
        description: null,
        transaction_date: new Date(),
        reference_number: null,
      });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      setError('Failed to record transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    setFormData((prev: CreateTransactionInput) => ({ 
      ...prev, 
      transaction_date: date 
    }));
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Transaction Recorded Successfully!</h3>
            <p className="text-green-600">The transaction has been added to the ledger.</p>
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
        {/* Account Selection */}
        <div className="space-y-2">
          <Label htmlFor="account_id" className="text-sm font-medium">
            Account *
          </Label>
          {isLoadingAccounts ? (
            <div className="h-10 bg-slate-200 animate-pulse rounded-md"></div>
          ) : (
            <Select
              value={formData.account_id === 0 ? '' : formData.account_id.toString()}
              onValueChange={(value) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  account_id: parseInt(value) 
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account: Account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-xs text-slate-500">
                        {account.account_number} • {account.account_type}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {accounts.length === 0 && !isLoadingAccounts && (
            <p className="text-xs text-amber-600">
              No accounts available. Please create an account first.
            </p>
          )}
        </div>

        {/* Transaction Type and Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="transaction_type" className="text-sm font-medium">
              Transaction Type *
            </Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  transaction_type: value as CreateTransactionInput['transaction_type']
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">
                  <div>
                    <div className="font-medium">Debit</div>
                    <div className="text-xs text-slate-500">Decrease assets/increase expenses</div>
                  </div>
                </SelectItem>
                <SelectItem value="credit">
                  <div>
                    <div className="font-medium">Credit</div>
                    <div className="text-xs text-slate-500">Increase assets/decrease expenses</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTransactionInput) => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))
              }
              required
              className="w-full"
            />
          </div>
        </div>

        {/* Transaction Date */}
        <div className="space-y-2">
          <Label htmlFor="transaction_date" className="text-sm font-medium">
            Transaction Date *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              id="transaction_date"
              type="date"
              value={formatDateForInput(formData.transaction_date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
              required
              className="w-full pl-10"
            />
          </div>
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <Label htmlFor="reference_number" className="text-sm font-medium">
            Reference Number
          </Label>
          <Input
            id="reference_number"
            placeholder="Optional reference (e.g., invoice #, check #)"
            value={formData.reference_number || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateTransactionInput) => ({ 
                ...prev, 
                reference_number: e.target.value || null 
              }))
            }
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Enter a reference number for tracking (optional)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the transaction..."
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateTransactionInput) => ({ 
                ...prev, 
                description: e.target.value || null 
              }))
            }
            rows={3}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Provide details about this transaction (optional)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                account_id: 0,
                transaction_type: 'debit',
                amount: 0,
                description: null,
                transaction_date: new Date(),
                reference_number: null,
              });
              setError(null);
            }}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || accounts.length === 0}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Recording...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Record Transaction
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Transaction Guide */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h4 className="text-sm font-medium mb-4">Transaction Recording Guide</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-red-800">Debit Transactions</div>
                <div className="text-red-600 text-xs">
                  Record debits for: expenses, asset purchases, loan payments, withdrawals
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-green-800">Credit Transactions</div>
                <div className="text-green-600 text-xs">
                  Record credits for: income received, sales, loan proceeds, deposits
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionForm;
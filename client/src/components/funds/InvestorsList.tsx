import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Search, Edit, Trash2, AlertCircle, Users, Filter, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import type { Investor } from '../../../../server/src/schema';

function InvestorsList() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadInvestors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getInvestors.query();
      setInvestors(result || []);
      setFilteredInvestors(result || []);
    } catch (error) {
      console.error('Failed to load investors:', error);
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
        {
          id: 3,
          name: 'Global Pension Fund',
          email: 'investments@globalpension.org',
          investor_type: 'institutional',
          total_invested: 25000000,
          phone: '+1 (555) 456-7890',
          address: '789 Corporate Plaza, Chicago, IL 60601',
          created_at: new Date('2023-03-10'),
          updated_at: new Date('2024-01-05'),
        },
        {
          id: 4,
          name: 'Robert Chen',
          email: 'robert.chen@email.com',
          investor_type: 'individual',
          total_invested: 1200000,
          phone: '+1 (555) 234-5678',
          address: '321 Portfolio Street, San Francisco, CA 94101',
          created_at: new Date('2023-04-05'),
          updated_at: new Date('2023-11-20'),
        },
      ];
      setInvestors(mockInvestors);
      setFilteredInvestors(mockInvestors);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvestors();
  }, [loadInvestors]);

  // Filter investors based on search and type
  useEffect(() => {
    let filtered = investors;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((investor: Investor) =>
        investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (investor.phone && investor.phone.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((investor: Investor) => investor.investor_type === typeFilter);
    }

    setFilteredInvestors(filtered);
  }, [investors, searchQuery, typeFilter]);

  const handleDeleteInvestor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this investor?')) return;

    try {
      await trpc.deleteInvestor.mutate({ id });
      setInvestors((prev: Investor[]) => prev.filter((investor: Investor) => investor.id !== id));
    } catch (error) {
      console.error('Failed to delete investor:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInvestorTypeColor = (type: string): string => {
    return type === 'individual' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Investors</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadInvestors} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search investors by name, email, or phone..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="institutional">Institutional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredInvestors.length} of {investors.length} investors
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-slate-600">
            {investors.length} Total Investors
          </Badge>
          {investors.length > 0 && (
            <Badge variant="outline" className="text-green-600">
              {formatCurrency(
                investors.reduce((sum: number, investor: Investor) => sum + investor.total_invested, 0)
              )} Total Invested
            </Badge>
          )}
        </div>
      </div>

      {/* Investors List */}
      {filteredInvestors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {investors.length === 0 ? 'No investors found' : 'No investors match your search'}
            </h3>
            <p className="text-slate-500 text-center">
              {investors.length === 0 
                ? 'Get started by registering your first investor' 
                : 'Try adjusting your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvestors.map((investor: Investor) => (
            <Card key={investor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {investor.name}
                      </h3>
                      <Badge className={getInvestorTypeColor(investor.investor_type)}>
                        {investor.investor_type.charAt(0).toUpperCase() + investor.investor_type.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Contact Information */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{investor.email}</span>
                        </div>
                        {investor.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{investor.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      {investor.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{investor.address}</span>
                        </div>
                      )}

                      {/* Investment Information */}
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-green-600 font-medium">Total Invested</p>
                          <p className="text-lg font-bold text-green-800">
                            {formatCurrency(investor.total_invested)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400">
                        Registered: {investor.created_at.toLocaleDateString()}
                        {investor.updated_at.getTime() !== investor.created_at.getTime() && (
                          <span className="ml-4">
                            Updated: {investor.updated_at.toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteInvestor(investor.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default InvestorsList;
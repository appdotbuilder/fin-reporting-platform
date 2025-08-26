import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Plus, BarChart3 } from 'lucide-react';

// Import sub-components
import FundsList from './funds/FundsList';
import FundForm from './funds/FundForm';
import InvestorsList from './funds/InvestorsList';
import InvestorForm from './funds/InvestorForm';

function FundAdministrationModule() {
  const [activeTab, setActiveTab] = useState<string>('funds-list');

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              Fund Administration
            </h2>
            <p className="text-purple-100 text-lg">
              Manage investment funds and investor relationships
            </p>
          </div>
          <div className="hidden md:block">
            <BarChart3 className="w-16 h-16 text-white opacity-20" />
          </div>
        </div>
      </div>

      {/* Fund Administration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger 
            value="funds-list" 
            className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <TrendingUp className="w-4 h-4" />
            Funds
          </TabsTrigger>
          <TabsTrigger 
            value="fund-form" 
            className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Fund
          </TabsTrigger>
          <TabsTrigger 
            value="investors-list" 
            className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <Users className="w-4 h-4" />
            Investors
          </TabsTrigger>
          <TabsTrigger 
            value="investor-form" 
            className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Investor
          </TabsTrigger>
        </TabsList>

        {/* Funds List */}
        <TabsContent value="funds-list">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Investment Funds
              </CardTitle>
              <CardDescription>
                View and manage all investment funds in your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FundsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fund Form */}
        <TabsContent value="fund-form">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Create New Fund
              </CardTitle>
              <CardDescription>
                Set up a new investment fund with initial parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FundForm onSuccess={() => setActiveTab('funds-list')} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investors List */}
        <TabsContent value="investors-list">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Investor Directory
              </CardTitle>
              <CardDescription>
                Manage investor profiles and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvestorsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Form */}
        <TabsContent value="investor-form">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Add New Investor
              </CardTitle>
              <CardDescription>
                Register a new investor in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvestorForm onSuccess={() => setActiveTab('investors-list')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FundAdministrationModule;
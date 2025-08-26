import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Target, Plus, PieChart } from 'lucide-react';

// Import sub-components
import PortfoliosList from './portfolio/PortfoliosList';
import PortfolioForm from './portfolio/PortfolioForm';
import AssetsList from './portfolio/AssetsList';
import AssetForm from './portfolio/AssetForm';

function PortfolioManagementModule() {
  const [activeTab, setActiveTab] = useState<string>('portfolios-list');

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Wallet className="w-8 h-8" />
              Portfolio Management
            </h2>
            <p className="text-orange-100 text-lg">
              Monitor and manage investor portfolios and asset allocations
            </p>
          </div>
          <div className="hidden md:block">
            <PieChart className="w-16 h-16 text-white opacity-20" />
          </div>
        </div>
      </div>

      {/* Portfolio Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger 
            value="portfolios-list" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Wallet className="w-4 h-4" />
            Portfolios
          </TabsTrigger>
          <TabsTrigger 
            value="portfolio-form" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Plus className="w-4 h-4" />
            Add Portfolio
          </TabsTrigger>
          <TabsTrigger 
            value="assets-list" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Target className="w-4 h-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger 
            value="asset-form" 
            className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </TabsTrigger>
        </TabsList>

        {/* Portfolios List */}
        <TabsContent value="portfolios-list">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-orange-600" />
                Investment Portfolios
              </CardTitle>
              <CardDescription>
                View and manage all investor portfolios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfoliosList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Form */}
        <TabsContent value="portfolio-form">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                Create New Portfolio
              </CardTitle>
              <CardDescription>
                Set up a new portfolio for an investor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioForm onSuccess={() => setActiveTab('portfolios-list')} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets List */}
        <TabsContent value="assets-list">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Portfolio Assets
              </CardTitle>
              <CardDescription>
                View and manage all assets across portfolios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssetsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asset Form */}
        <TabsContent value="asset-form">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                Add New Asset
              </CardTitle>
              <CardDescription>
                Add a new asset to a portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssetForm onSuccess={() => setActiveTab('assets-list')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PortfolioManagementModule;
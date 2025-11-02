
import React, { useState } from 'react';
import ManagementDashboard from './components/ManagementDashboard';
import AuctionControlPanel from './components/AuctionControlPanel';
import AuctionSetupPanel from './components/AuctionSetupPanel';
import OverlayDashboard from './components/OverlayDashboard';
import { AuctionProvider } from './hooks/useAuction';
import { ProStreamIcon } from './components/icons';

type MainView = 'auction' | 'manage' | 'overlays' | 'users';
type ManageSubView = 'tournaments' | 'teams' | 'players';
type AuctionSubView = 'control' | 'setup';

const App: React.FC = () => {
  const [mainView, setMainView] = useState<MainView>('manage');
  const [manageSubView, setManageSubView] = useState<ManageSubView>('tournaments');
  const [auctionSubView, setAuctionSubView] = useState<AuctionSubView>('setup');

  const renderSubNav = () => {
    if (mainView === 'manage') {
      return (
        <div className="flex items-center space-x-8">
          <SubNavButton
            label="Tournaments"
            isActive={manageSubView === 'tournaments'}
            onClick={() => setManageSubView('tournaments')}
          />
          <SubNavButton
            label="Teams"
            isActive={manageSubView === 'teams'}
            onClick={() => setManageSubView('teams')}
          />
          <SubNavButton
            label="Players"
            isActive={manageSubView === 'players'}
            onClick={() => setManageSubView('players')}
          />
        </div>
      );
    }
    if (mainView === 'auction') {
      return (
        <div className="flex items-center space-x-8">
          <SubNavButton
            label="Auction Control"
            isActive={auctionSubView === 'control'}
            onClick={() => setAuctionSubView('control')}
          />
          <SubNavButton
            label="Auction Setup"
            isActive={auctionSubView === 'setup'}
            onClick={() => setAuctionSubView('setup')}
          />
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (mainView === 'manage') {
      return <ManagementDashboard view={manageSubView} />;
    }
    if (mainView === 'auction') {
      if (auctionSubView === 'control') {
        return <AuctionControlPanel />;
      }
      if (auctionSubView === 'setup') {
        return <AuctionSetupPanel />;
      }
    }
    if (mainView === 'overlays') {
      return <OverlayDashboard />;
    }
    return <div className="text-center p-8 text-neutral-500">This section is under construction.</div>;
  };


  return (
    <AuctionProvider>
      <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
        <header className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 sticky top-0 z-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <ProStreamIcon className="h-8 w-8 text-brand-primary" />
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-bold tracking-tight">ProStream</h1>
                  <span className="text-lg font-medium text-neutral-400">Auction</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                  <MainNavButton label="Auction" isActive={mainView === 'auction'} onClick={() => setMainView('auction')} />
                  <MainNavButton label="Manage" isActive={mainView === 'manage'} onClick={() => setMainView('manage')} />
                  <MainNavButton label="Overlays" isActive={mainView === 'overlays'} onClick={() => setMainView('overlays')} />
                  <MainNavButton label="Users" isActive={mainView === 'users'} onClick={() => setMainView('users')} />
              </div>

              <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                      <p className="text-neutral-400">Logged in as</p>
                      <p className="font-semibold text-white">Admin User <a href="#" className="text-blue-400 hover:underline">(admin)</a></p>
                  </div>
                  <button className="font-semibold text-neutral-300 hover:text-white transition-colors text-sm">Logout</button>
              </div>
            </div>
          </div>
          
           { (mainView === 'manage' || mainView === 'auction') && (
            <div className="border-t border-neutral-700/50 bg-neutral-800/30">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center">
                {renderSubNav()}
              </div>
            </div>
           )}
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>

      </div>
    </AuctionProvider>
  );
};

const MainNavButton: React.FC<{ label: string; isActive?: boolean; onClick?: () => void; soon?: boolean; }> = ({ label, isActive, onClick, soon }) => (
    <button
        onClick={onClick}
        disabled={soon}
        className={`relative flex items-center h-16 text-sm font-semibold transition-colors ${
            isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
        } ${soon ? 'cursor-not-allowed' : ''}`}
    >
        {label}
        {soon && <span className="ml-2 text-xs bg-neutral-600 text-neutral-300 px-1.5 py-0.5 rounded-sm">Soon</span>}
        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full"></div>}
    </button>
);

const SubNavButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-1 py-2 text-sm transition-colors duration-200 relative ${
      isActive
        ? 'font-semibold text-white'
        : 'font-medium text-neutral-400 hover:text-white'
    }`}
  >
    {label}
    {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-full"></div>}
  </button>
);


export default App;
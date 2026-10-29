import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ComplaintSidebar from './ComplaintSidebar';
import ComplaintHeader from './ComplaintHeader';
import { Bot } from 'lucide-react';
import { useComplaintContext, ComplaintProvider } from '../../context/ComplaintContext';

export { useComplaintContext };

const ComplaintLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [companies, setCompanies] = useState<string[]>(['All Companies']);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    let mounted = true;
    complaintService
      .getStats()
      .then((res) => {
        if (mounted && res?.stats?.companies) {
          setCompanies(res.stats.companies);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  // Determine current page title based on path
  const getPageTitle = (path: string): string => {
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/new')) return 'New Complaint';
    if (path.includes('/assign')) return 'Assign Complaint';
    if (path.includes('/tracker')) return 'Complaint Tracker';
    if (path.includes('/document-verification')) return 'Document Verification';
    if (path.includes('/verification')) return 'Verification';
    if (path.includes('/report')) return 'Report';
    if (path.includes('/technician-dashboard')) return 'Technician Dashboard';
    if (path.includes('/technician-tracker')) return 'Technician Tracker';
    if (path.includes('/approved')) return 'Approved Complaints';
    return 'Complaint Tracker';
  };

  const title = getPageTitle(location.pathname);

  return (
    <ComplaintContext.Provider
      value={{
        selectedCompany,
        setSelectedCompany,
        companies,
        refreshTrigger,
        triggerRefresh
      }}
    >
      <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ComplaintSidebar
            onClose={() => setMobileOpen(false)}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />
        </div>

        {/* Main layout */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ComplaintHeader
            title={title}
            onOpenMobileMenu={() => setMobileOpen(true)}
            companies={companies}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Floating AI / Support Bot Icon in bottom right matching screenshot */}
        <div className="fixed bottom-5 right-5 z-40">
          <button
            title="Complaint Support Assistant"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-transform"
          >
            <Bot className="w-6 h-6" />
          </button>
        </div>
      </div>
    </ComplaintContext.Provider>
  );
};

export default ComplaintLayout;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';

export interface ComplaintContextType {
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  companies: string[];
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const defaultContext: ComplaintContextType = {
  selectedCompany: 'All Companies',
  setSelectedCompany: () => {},
  companies: ['All Companies'],
  refreshTrigger: 0,
  triggerRefresh: () => {}
};

export const ComplaintContext = createContext<ComplaintContextType>(defaultContext);

export const useComplaintContext = () => useContext(ComplaintContext);

export const ComplaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [companies, setCompanies] = useState<string[]>(['All Companies']);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      {children}
    </ComplaintContext.Provider>
  );
};

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface OrgContextType {
  orgId: string | null;
  setOrgId: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orgId, setOrgIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected_org_id');
  });

  useEffect(() => {
    if (!user && orgId) {
      setOrgIdState(null);
      localStorage.removeItem('selected_org_id');
    }
  }, [user, orgId]);

  const setOrgId = (newOrgId: string) => {
    setOrgIdState(newOrgId);
    localStorage.setItem('selected_org_id', newOrgId);
  };

  return (
    <OrgContext.Provider value={{ orgId, setOrgId }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}

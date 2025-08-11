import { createContext, useState } from "react";

export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState(null);

  return (
    <CompanyContext.Provider value={{ companyInfo, setCompanyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};
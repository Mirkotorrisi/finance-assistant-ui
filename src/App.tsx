import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { TransactionsPage } from "@/components/transactions/TransactionsPage";
import { mockFinancialData } from "@/data/mockData";
import { financialDataService } from "@/services";
import type { FinancialData } from "@/types/finance";

function DashboardPage() {
  const [data, setData] = useState<FinancialData>(mockFinancialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const financialData = await financialDataService.getCurrentFinancialData();
        setData(financialData);
      } catch (err) {
        console.error("Failed to fetch financial data:", err);
        setError("Failed to load financial data. Using mock data.");
        // Fallback to mock data on error
        setData(mockFinancialData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading financial data...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Warning</p>
          <p>{error}</p>
        </div>
      )}
      <Dashboard data={data} />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

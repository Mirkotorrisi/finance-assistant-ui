import { useState, useEffect } from "react";
import "./App.css";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { mockFinancialData } from "@/data/mockData";
import { financialDataService } from "@/services";
import type { FinancialData } from "@/types/finance";

function App() {
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

  if (error) {
    console.warn(error);
  }

  return <Dashboard data={data} />;
}

export default App;

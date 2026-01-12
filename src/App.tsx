import "./App.css";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { mockFinancialData } from "@/data/mockData";

function App() {
  return <Dashboard data={mockFinancialData} />;
}

export default App;

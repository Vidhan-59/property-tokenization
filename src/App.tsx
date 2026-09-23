import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LlpBrowsePage } from "./pages/LlpBrowsePage";
import { LlpDetailPage } from "./pages/LlpDetailPage";
import { InvestWizardPage } from "./pages/InvestWizardPage";
import { PortfolioPage } from "./pages/PortfolioPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/llps" replace />} />
        <Route path="/llps" element={<LlpBrowsePage />} />
        <Route path="/llps/:fundId" element={<LlpDetailPage />} />
        <Route path="/llps/:fundId/invest" element={<InvestWizardPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="*" element={<Navigate to="/llps" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

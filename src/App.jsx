// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import AnalysisTradesPage from './pages/AnalysisTradesPage';
import CompareStrategiesPage from './pages/CompareStrategiesPage';
import CompareSymbolsPage from './pages/CompareSymbolsPage';
import CompareResultsPage from './pages/CompareResultsPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div>
      <nav className="navbar navbar-expand navbar-dark bg-dark px-3">
        <Link className="navbar-brand" to="/">
          Trader
        </Link>
        <div className="navbar-nav">
          <Link className="nav-link" to="/analysis/trades">Trades</Link>
          <Link className="nav-link" to="/analysis/compare-strategies">Comparar Estrategias</Link>
          <Link className="nav-link" to="/analysis/compare-symbols">Comparar Acciones</Link>
          <Link className="nav-link" to="/analysis/compare-results">Comparar Resultados</Link>
        </div>
      </nav>

      <div className="container my-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analysis/trades" element={<AnalysisTradesPage />} />
          <Route path="/analysis/compare-strategies" element={<CompareStrategiesPage />} />
          <Route path="/analysis/compare-symbols" element={<CompareSymbolsPage />} />
          <Route path="/analysis/compare-results" element={<CompareResultsPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

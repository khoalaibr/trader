// src/pages/AnalysisPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTradesAndStats } from '../store/features/analysisSlice';

function AnalysisPage() {
  const dispatch = useDispatch();
  const { trades, stats, isLoading, error } = useSelector(state => state.analysis);

  // Variables de estado (puedes usar un formulario más elaborado):
  const [symbol, setSymbol] = useState('');
  const [strategy, setStrategy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // Maneja el submit para fetch de trades
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchTradesAndStats({
      symbol,
      strategy,
      startDate,
      endDate,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
    }));
  };

  return (
    <div>
      <h1>Análisis</h1>
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-2">
          <label>Symbol</label>
          <input 
            className="form-control"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Strategy</label>
          <input 
            className="form-control"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Start Date</label>
          <input 
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>End Date</label>
          <input 
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Stop Loss</label>
          <input 
            className="form-control"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Take Profit</label>
          <input 
            className="form-control"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
          />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            {isLoading ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger mt-3">Error: {JSON.stringify(error)}</div>}

      {!isLoading && stats.totalTrades !== undefined && (
        <div className="mt-4">
          <h4>Resultados</h4>
          <p>Total Trades: {stats.totalTrades}</p>
          <p>Avg Profit/Loss: {stats.avgProfitLoss}</p>
          <p>Winners: {stats.winners}</p>
          <p>Losers: {stats.losers}</p>
          <p>Win Rate: {stats.winRate}%</p>

          <table className="table table-striped mt-3">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>ProfitLoss</th>
                <th>Entry Date</th>
                <th>Exit Date</th>
                {/* ...otros campos */}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, index) => (
                <tr key={index}>
                  <td>{t.backtestRun?.symbol}</td>
                  <td>{t.profitLoss}</td>
                  <td>{t.entryDate}</td>
                  <td>{t.exitDate}</td>
                  {/* ... */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AnalysisPage;

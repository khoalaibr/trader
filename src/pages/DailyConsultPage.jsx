// src/pages/DailyConsultPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLiveSignal } from '../store/features/dailyConsultSlice';

function DailyConsultPage() {
  const dispatch = useDispatch();
  const { liveSignalResult, isLoading, error } = useSelector(state => state.dailyConsult);

  const [symbol, setSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [strategy, setStrategy] = useState('Ema50Ema200Macd');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchLiveSignal({
      symbol,
      startDate,
      endDate,
      strategy,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
    }));
  };

  return (
    <div>
      <h1>Consulta Diaria</h1>
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
          <label>Strategy</label>
          <input 
            className="form-control"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
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

      {liveSignalResult && !isLoading && (
        <div className="mt-4">
          <h4>Resultado del Live Signal</h4>
          <p><strong>Symbol:</strong> {liveSignalResult.symbol}</p>
          <p><strong>Strategy:</strong> {liveSignalResult.strategy}</p>
          <p><strong>StopLoss:</strong> {liveSignalResult.stopLoss}</p>
          <p><strong>TakeProfit:</strong> {liveSignalResult.takeProfit}</p>
          {/* La respuesta exacta depende de cómo tu NestJS devuelva los datos */}
          <pre>{JSON.stringify(liveSignalResult.results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default DailyConsultPage;

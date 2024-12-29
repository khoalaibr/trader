// src/pages/CompareStrategiesPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compareStrategies } from '../store/features/analysisSlice';

import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function CompareStrategiesPage() {
  const dispatch = useDispatch();
  const { compareStrategiesData, loading, error } = useSelector((state) => state.analysis);

  // Filtros (todos opcionales)
  const [symbol, setSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      compareStrategies({
        symbol: symbol || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      })
    );
  };

  // ========================
  // Preparar data para exportar
  // ========================

  // 1) CSV
  const csvHeaders = [
    { label: 'Strategy', key: 'strategy' },
    { label: 'TotalTrades', key: 'totalTrades' },
    { label: 'AvgProfitLoss', key: 'avgProfitLoss' },
    { label: 'Winners', key: 'winners' },
    { label: 'Losers', key: 'losers' },
    { label: 'WinRate', key: 'winRate' },
  ];

  const csvData = compareStrategiesData?.results?.map((res) => ({
    strategy: res.strategy,
    totalTrades: res.totalTrades,
    avgProfitLoss: res.avgProfitLoss,
    winners: res.winners,
    losers: res.losers,
    winRate: res.winRate,
  })) || [];

  // 2) Excel
  const exportToExcel = () => {
    const data = compareStrategiesData?.results?.map((res) => ({
      strategy: res.strategy,
      totalTrades: res.totalTrades,
      avgProfitLoss: res.avgProfitLoss,
      winners: res.winners,
      losers: res.losers,
      winRate: res.winRate,
    })) || [];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CompareStrategies');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `compare_strategies_${new Date().toISOString()}.xlsx`);
  };

  // 3) PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Strategy', 'TotalTrades', 'AvgProfitLoss', 'Winners', 'Losers', 'WinRate'];
    const tableRows = [];

    compareStrategiesData?.results?.forEach((res) => {
      const row = [
        res.strategy,
        res.totalTrades,
        res.avgProfitLoss,
        res.winners,
        res.losers,
        `${res.winRate}%`,
      ];
      tableRows.push(row);
    });

    doc.text('Reporte Comparar Estrategias', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`compare_strategies_${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h2>Comparar Estrategias</h2>
      <p>Este endpoint: <code>GET /analysis/compare-strategies</code></p>

      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-2">
          <label>Symbol (opcional)</label>
          <input
            className="form-control"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Start Date (opcional)</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>End Date (opcional)</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Stop Loss (opcional)</label>
          <input
            className="form-control"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Take Profit (opcional)</label>
          <input
            className="form-control"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
          />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            {loading ? 'Consultando...' : 'Comparar Estrategias'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger mt-3">Error: {JSON.stringify(error)}</div>}

      {compareStrategiesData && !loading && (
        <div className="mt-4">
          <h4>Resultados para symbol: {compareStrategiesData.symbol}</h4>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Total Trades</th>
                <th>Avg ProfitLoss</th>
                <th>Winners</th>
                <th>Losers</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {compareStrategiesData.results.map((res, idx) => (
                <tr key={idx}>
                  <td>{res.strategy}</td>
                  <td>{res.totalTrades}</td>
                  <td>{res.avgProfitLoss}</td>
                  <td>{res.winners}</td>
                  <td>{res.losers}</td>
                  <td>{res.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Botones de descarga */}
          <div className="mt-3 d-flex gap-2">
            <CSVLink
              headers={csvHeaders}
              data={csvData}
              filename={`compare_strategies_${new Date().toISOString()}.csv`}
              className="btn btn-secondary"
            >
              Descargar CSV
            </CSVLink>

            <button onClick={exportToExcel} className="btn btn-success">
              Descargar Excel
            </button>

            <button onClick={exportToPDF} className="btn btn-danger">
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompareStrategiesPage;

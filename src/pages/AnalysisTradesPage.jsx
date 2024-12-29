// src/pages/AnalysisTradesPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrades } from '../store/features/analysisSlice';

import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function AnalysisTradesPage() {
  const dispatch = useDispatch();
  const { tradesData, loading, error } = useSelector((state) => state.analysis);

  // Filtros (todos opcionales)
  const [symbol, setSymbol] = useState('');
  const [strategy, setStrategy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      fetchTrades({
        symbol: symbol || undefined,
        strategy: strategy || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      })
    );
  };

  // ========================
  // 1) CSV
  // ========================
  const csvHeaders = [
    { label: 'Symbol', key: 'symbol' },
    { label: 'ProfitLoss', key: 'profitLoss' },
    { label: 'EntryDate', key: 'entryDate' },
    { label: 'ExitDate', key: 'exitDate' },
  ];
  const csvData = tradesData?.trades?.map((trade) => ({
    symbol: trade.backtestRun?.symbol,
    profitLoss: trade.profitLoss,
    entryDate: trade.entryDate,
    exitDate: trade.exitDate,
  })) || [];

  // ========================
  // 2) Excel (.xlsx)
  // ========================
  const exportToExcel = () => {
    const data = tradesData?.trades?.map((trade) => ({
      symbol: trade.backtestRun?.symbol,
      profitLoss: trade.profitLoss,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
    })) || [];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `trades_report_${new Date().toISOString()}.xlsx`);
  };

  // ========================
  // 3) PDF
  // ========================
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Symbol', 'ProfitLoss', 'Entry Date', 'Exit Date'];
    const tableRows = [];

    tradesData?.trades?.forEach((trade) => {
      const row = [
        trade.backtestRun?.symbol,
        trade.profitLoss,
        trade.entryDate,
        trade.exitDate,
      ];
      tableRows.push(row);
    });

    doc.text('Reporte de Trades', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`trades_report_${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h2>Trades</h2>
      <p>Este endpoint: <code>GET /analysis/trades</code></p>

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
          <label>Strategy (opcional)</label>
          <input
            className="form-control"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
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
            {loading ? 'Consultando...' : 'Consultar Trades'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger mt-3">Error: {JSON.stringify(error)}</div>}

      {tradesData && !loading && (
        <div className="mt-4">
          <h4>Resumen estadístico</h4>
          <p>Total trades: {tradesData.totalTrades}</p>
          <p>Avg Profit/Loss: {tradesData.avgProfitLoss}</p>
          <p>Winners: {tradesData.winners}</p>
          <p>Losers: {tradesData.losers}</p>
          <p>Win Rate: {tradesData.winRate}%</p>

          <h5>Listado de trades</h5>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>ProfitLoss</th>
                <th>Entry Date</th>
                <th>Exit Date</th>
              </tr>
            </thead>
            <tbody>
              {tradesData.trades?.map((trade, idx) => (
                <tr key={idx}>
                  <td>{trade.backtestRun?.symbol}</td>
                  <td>{trade.profitLoss}</td>
                  <td>{trade.entryDate}</td>
                  <td>{trade.exitDate}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* BOTONES DE DESCARGA */}
          <div className="mt-3 d-flex gap-2">
            <CSVLink
              headers={csvHeaders}
              data={csvData}
              filename={`trades_report_${new Date().toISOString()}.csv`}
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

export default AnalysisTradesPage;

// src/pages/BacktestAllPage.jsx
import React, { useState } from 'react';
import mlApi from '../services/mlApi';

import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function BacktestAllPage() {
  const strategies = [
    "breakout_range", 
    "fibonacci_rsi", 
    "macd_crossover", 
    "rsi_v2", 
    "volume_breakout"
  ];

  const [results, setResults] = useState([]); 
  // results => [ { strategy: '...', data: [ ... ] }, ... ]

  const [flattenedData, setFlattenedData] = useState([]); 
  // "plano" para exportar CSV/Excel/PDF

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Al hacer clic, recorre las estrategias y llama a GET /backtestAll/<strategy>
  const handleRunAll = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setFlattenedData([]);

    try {
      const promises = strategies.map(async (strat) => {
        const response = await mlApi.get(`/backtestAll/${strat}`);
        
        // La respuesta es un objeto, ej:
        // {
        //   "P2LT34": { symbol: "P2LT34", date: "2025-01-09", action: "Sell" },
        //   "G1DS34": { symbol: "G1DS34", date: "2025-01-09", action: "Buy" },
        //   ...
        // }
        let dataArr = Object.values(response.data);

        // Filtrar para mostrar SÓLO Buy y Sell
        dataArr = dataArr.filter(item => 
          item.action === 'Buy' || item.action === 'Sell'
        );

        return { strategy: strat, data: dataArr };
      });

      const allResults = await Promise.all(promises);
      // allResults => [ { strategy, data: [...] }, { strategy, data: [...] }, ... ]

      setResults(allResults);

      // Crear flattenedData
      // Suponiendo que cada item => { symbol, date, action, ... }
      const flattened = [];
      allResults.forEach((res) => {
        const strat = res.strategy;
        res.data.forEach((item) => {
          flattened.push({
            strategy: strat,
            symbol: item.symbol || '',
            date: item.date || '',
            action: item.action || ''
          });
        });
      });
      setFlattenedData(flattened);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al consultar /backtestAll/<strategy>');
    } finally {
      setLoading(false);
    }
  };

  // === Config export CSV/Excel/PDF ===
  const csvHeaders = [
    { label: 'Strategy', key: 'strategy' },
    { label: 'Symbol', key: 'symbol' },
    { label: 'Date', key: 'date' },
    { label: 'Action', key: 'action' },
  ];

  const csvData = flattenedData;

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BacktestAll');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `backtest_all_${new Date().toISOString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Strategy', 'Symbol', 'Date', 'Action'];
    const tableRows = [];

    csvData.forEach((item) => {
      tableRows.push([
        item.strategy,
        item.symbol,
        item.date,
        item.action
      ]);
    });

    doc.text('Reporte Backtest All', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`backtest_all_${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h2>Backtest All Estrategias</h2>
      <p>
        Se llama a <code>/backtestAll/&lt;strategy&gt;</code> en 
        {` ${import.meta.env.VITE_API_SERVICE} `}
        para estas estrategias:
        {` [ ${strategies.join(', ')} ]`}
      </p>

      <button 
        className="btn btn-primary mb-3"
        onClick={handleRunAll}
        disabled={loading}
      >
        {loading ? 'Cargando...' : 'Ejecutar Backtest All'}
      </button>

      {error && <div className="alert alert-danger">{error}</div>}

      {csvData.length > 0 && !loading && (
        <div className="mb-3 d-flex gap-2">
          <CSVLink
            headers={csvHeaders}
            data={csvData}
            filename={`backtest_all_${new Date().toISOString()}.csv`}
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
      )}

      {results.map((res, idx) => (
        <div key={idx} className="mb-4">
          <h4>Estrategia: {res.strategy}</h4>
          {(!res.data || res.data.length === 0) && (
            <p className="text-muted">Sin datos (Buy/Sell)</p>
          )}
          {res.data && res.data.length > 0 && (
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {res.data.map((item, i) => (
                  <tr key={i}>
                    <td>{item.symbol}</td>
                    <td>{item.date}</td>
                    <td>{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

export default BacktestAllPage;

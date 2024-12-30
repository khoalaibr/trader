// src/pages/HomePage.jsx
import React, { useState } from 'react';
import api from '../services/api';  // Tu instancia de Axios

import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function HomePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estructura final de datos:
  // [
  //   {
  //     strategy,
  //     stopLoss,
  //     takeProfit,
  //     symbols: [
  //       {
  //         symbol,
  //         response,
  //         trades: [
  //           { entryDate, exitDate, profitLoss, ... }
  //         ]
  //       }
  //     ]
  //   }
  // ]
  const [dailySignals, setDailySignals] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDailySignals([]);

    try {
      // 1) Llamar a /backtest/dailySelectSignals
      const { data } = await api.get('/backtest/dailySelectSignals', {
        params: {
          startDate,
          endDate
        }
      });
      // data es el array con strategy, stopLoss, takeProfit, symbols
      // 2) Para cada strategy, para cada symbol, llamar a /backtest/trades
      const results = await Promise.all(
        data.map(async (item) => {
          const { strategy, stopLoss, takeProfit, symbols } = item;
          // Para cada symbol, buscamos sus trades
          const newSymbols = await Promise.all(
            symbols.map(async (symObj) => {
              const { symbol, response } = symObj;
              // Llamada a /backtest/trades
              const tradesResp = await api.get('/backtest/trades', {
                params: {
                  symbol,
                  strategy,
                  startDate,
                  endDate,
                  stopLoss,
                  takeProfit
                }
              });
              // tradesResp.data: { trades: [...], symbol, strategy, etc. }
              const trades = tradesResp.data.trades || [];
              return {
                symbol,
                response,
                trades
              };
            })
          );
          return {
            strategy,
            stopLoss,
            takeProfit,
            symbols: newSymbols
          };
        })
      );

      setDailySignals(results);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al consultar dailySelectSignals');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EXPORTAR CSV / EXCEL / PDF
  // =========================================================
  // Convertimos la estructura anidada dailySignals en rows "planos"
  // con columns: Strategy, StopLoss, TakeProfit, Symbol, Response, EntryDate, ExitDate, ProfitLoss
  const flattenData = () => {
    const rows = [];
    dailySignals.forEach((ds) => {
      ds.symbols.forEach((sym) => {
        if (sym.trades && sym.trades.length > 0) {
          sym.trades.forEach((tr) => {
            rows.push({
              strategy: ds.strategy,
              stopLoss: ds.stopLoss,
              takeProfit: ds.takeProfit,
              symbol: sym.symbol,
              response: sym.response,
              entryDate: tr.entryDate,
              exitDate: tr.exitDate,
              profitLoss: tr.profitLoss
            });
          });
        } else {
          // Caso en que no haya trades
          rows.push({
            strategy: ds.strategy,
            stopLoss: ds.stopLoss,
            takeProfit: ds.takeProfit,
            symbol: sym.symbol,
            response: sym.response,
            entryDate: '',
            exitDate: '',
            profitLoss: ''
          });
        }
      });
    });
    return rows;
  };

  const csvHeaders = [
    { label: 'Strategy', key: 'strategy' },
    { label: 'StopLoss', key: 'stopLoss' },
    { label: 'TakeProfit', key: 'takeProfit' },
    { label: 'Symbol', key: 'symbol' },
    { label: 'Response', key: 'response' },
    { label: 'EntryDate', key: 'entryDate' },
    { label: 'ExitDate', key: 'exitDate' },
    { label: 'ProfitLoss', key: 'profitLoss' },
  ];

  const csvData = flattenData();

  // 1) CSV
  // Utilizamos react-csv => <CSVLink ... />

  // 2) Excel
  const exportToExcel = () => {
    const data = csvData;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DailySelectSignals');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `daily_select_signals_${new Date().toISOString()}.xlsx`);
  };

  // 3) PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      'Strategy', 'StopLoss', 'TakeProfit', 'Symbol', 'Response', 'EntryDate', 'ExitDate', 'ProfitLoss'
    ];
    const tableRows = csvData.map((row) => [
      row.strategy,
      row.stopLoss,
      row.takeProfit,
      row.symbol,
      row.response,
      row.entryDate,
      row.exitDate,
      row.profitLoss
    ]);

    doc.text('Daily Select Signals', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 } // Ajustar si es muy grande la tabla
    });
    doc.save(`daily_select_signals_${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h2>Home - Daily Select Signals</h2>
      <p>
        Consulta el endpoint <code>GET /backtest/dailySelectSignals</code> con un periodo de tiempo
        (startDate, endDate), y para cada strategy/symbol, muestra los trades.
      </p>

      <form onSubmit={handleSubmit} className="row g-3 mb-3">
        <div className="col-md-3">
          <label>Start Date</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger">Error: {error}</div>}

      {/* Si dailySignals tiene datos, los mostramos */}
      {dailySignals.length > 0 && !loading && (
        <div className="mt-3">
          <h4>Resultados</h4>
          {dailySignals.map((ds, idx) => (
            <div key={idx} className="mb-4">
              <h5>
                Estrategia: {ds.strategy} | StopLoss: {ds.stopLoss} | TakeProfit: {ds.takeProfit}
              </h5>

              {ds.symbols.map((symObj, sidx) => (
                <div key={sidx} className="ms-3 mb-2">
                  <strong>{symObj.symbol}</strong> ({symObj.response})
                  <br />
                  {symObj.trades.length > 0 ? (
                    <table className="table table-sm table-bordered mt-2">
                      <thead>
                        <tr>
                          <th>Entry Date</th>
                          <th>Exit Date</th>
                          <th>ProfitLoss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symObj.trades.map((t, tidx) => (
                          <tr key={tidx}>
                            <td>{t.entryDate}</td>
                            <td>{t.exitDate}</td>
                            <td>{t.profitLoss}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">No hay trades en este período.</p>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Botones de export */}
          <div className="mt-3 d-flex gap-2">
            {/* CSV */}
            <CSVLink
              headers={csvHeaders}
              data={csvData}
              filename={`daily_select_signals_${new Date().toISOString()}.csv`}
              className="btn btn-secondary"
            >
              Descargar CSV
            </CSVLink>

            {/* Excel */}
            <button onClick={exportToExcel} className="btn btn-success">
              Descargar Excel
            </button>

            {/* PDF */}
            <button onClick={exportToPDF} className="btn btn-danger">
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;


// src/pages/ConsolidatedActionsPage.jsx
import React, { useState } from 'react';
import mlApi from '../services/mlApi';

import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ConsolidatedActionsPage() {
  // Las mismas estrategias que antes
  const strategies = [
    "breakout_range", 
    "fibonacci_rsi", 
    "macd_crossover", 
    "rsi_v2", 
    "volume_breakout"
  ];

  // 1) State para almacenar la data “consolidada” por acción
  // Estructura final: 
  // {
  //   G2DD34: {
  //     breakout_range: "Buy",
  //     fibonacci_rsi: "Sell",
  //     ...
  //   },
  //   PETR4: {
  //     breakout_range: "Buy",
  //     ...
  //   },
  //   ...
  // }
  const [consolidated, setConsolidated] = useState({});

  // Para el render en tabla
  // Lo convertiremos a un array de { symbol, strategy, action }
  const [flattenedData, setFlattenedData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * handleConsolidateActions
   *  - Llama a /backtestAll/<strategy> para cada una
   *  - Filtra Buy/Sell
   *  - Almacena en un "diccionario" consolidated[symbol][strategy] = "Buy"/"Sell"
   */
  const handleConsolidateActions = async () => {
    setLoading(true);
    setError(null);
    setConsolidated({});
    setFlattenedData([]);

    try {
      // 1) Hacemos las llamadas en paralelo
      const promises = strategies.map(async (strat) => {
        const resp = await mlApi.get(`/backtestAll/${strat}`);
        // resp.data => { symbolKey: { symbol, date, action }, ... }
        let dataArr = Object.values(resp.data);

        // Filtrar solo Buy y Sell
        dataArr = dataArr.filter(item => 
          item.action === 'Buy' || item.action === 'Sell'
        );

        return { strategy: strat, data: dataArr };
      });

      const allResults = await Promise.all(promises);

      // 2) Construimos un diccionario: symbol => { [strategy]: action }
      // Ej: consolidated["G2DD34"]["breakout_range"] = "Buy"
      const dictionary = {};

      allResults.forEach((res) => {
        const strat = res.strategy;
        res.data.forEach((item) => {
          const sym = item.symbol;
          if (!dictionary[sym]) {
            dictionary[sym] = {};
          }
          dictionary[sym][strat] = item.action;
        });
      });

      // 3) Convertimos "dictionary" a un array “plano” para exportar CSV/Excel/PDF
      //    Por ejemplo, { symbol, strategy, action }
      const flattened = [];
      Object.keys(dictionary).forEach((sym) => {
        // dictionary[sym] => { breakout_range: "Buy", volume_breakout: "Sell", ... }
        const stratObj = dictionary[sym];
        Object.keys(stratObj).forEach((s) => {
          flattened.push({
            symbol: sym,
            strategy: s,
            action: stratObj[s],
          });
        });
      });

      // Ordenar por symbol (opcional) 
      flattened.sort((a, b) => {
        // p.e. alfabéticamente por symbol
        return a.symbol.localeCompare(b.symbol) || 
               a.strategy.localeCompare(b.strategy);
      });

      setConsolidated(dictionary);
      setFlattenedData(flattened);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al consolidar acciones');
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Exportar CSV/Excel/PDF
  // ======================
  const csvHeaders = [
    { label: 'Symbol', key: 'symbol' },
    { label: 'Strategy', key: 'strategy' },
    { label: 'Action', key: 'action' },
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `consolidated_actions_${new Date().toISOString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Symbol', 'Strategy', 'Action'];
    const tableRows = [];

    flattenedData.forEach((item) => {
      tableRows.push([
        item.symbol,
        item.strategy,
        item.action
      ]);
    });

    doc.text('Consolidated Actions Report', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`consolidated_actions_${new Date().toISOString()}.pdf`);
  };

  // ======================
  // Render
  // ======================
  return (
    <div>
      <h2>Acciones Consolidadas entre Estrategias</h2>
      <p>
        Se consultan las mismas estrategias: 
        {`[ ${strategies.join(', ')} ]`} 
        en <code>/backtestAll/&lt;strategy&gt;</code>, 
        filtra solo Buy/Sell, y unifica en una sola vista.
      </p>

      {/* Botón para consolidar */}
      <button
        className="btn btn-primary mb-3"
        onClick={handleConsolidateActions}
        disabled={loading}
      >
        {loading ? 'Procesando...' : 'Consolidar Acciones (Buy/Sell)'}
      </button>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Botones de descarga */}
      {flattenedData.length > 0 && !loading && (
        <div className="mb-3 d-flex gap-2">
          <CSVLink
            headers={csvHeaders}
            data={flattenedData}
            filename={`consolidated_actions_${new Date().toISOString()}.csv`}
            className="btn btn-secondary"
          >
            CSV
          </CSVLink>

          <button onClick={exportToExcel} className="btn btn-success">
            Excel
          </button>

          <button onClick={exportToPDF} className="btn btn-danger">
            PDF
          </button>
        </div>
      )}

      {/* Vista final: un loop sobre consolidated => Symbol => (estrategia => action) */}
      {Object.keys(consolidated).length > 0 && !loading && (
        <div>
          {Object.keys(consolidated).sort().map((sym, idx) => {
            // consolidated[sym] => { breakout_range: "Buy", rsi_v2: "Sell", ... }
            const stratObj = consolidated[sym];
            return (
              <div key={idx} className="mb-3">
                <h5>{sym}</h5>
                <ul>
                  {Object.keys(stratObj).map((st) => (
                    <li key={st}>{st}: {stratObj[st]}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ConsolidatedActionsPage;

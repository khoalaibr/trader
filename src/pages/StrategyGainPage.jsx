// src/pages/StrategyGainPage.jsx
import React, { useState } from 'react';
import mlApi from '../services/mlApi';

// Para exportar CSV, Excel, PDF
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function StrategyGainPage() {
  // Parámetros principales
  const [stopLossPct, setStopLossPct] = useState('5.0');
  const [takeProfitPct, setTakeProfitPct] = useState('10.0');
  const [valor, setValor] = useState('1000');
  const [nActions, setNActions] = useState('40');
  const [hideOps, setHideOps] = useState(false);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data final
  const [strategiesData, setStrategiesData] = useState([]);
  const [strategySummaries, setStrategySummaries] = useState([]);
  const [bestSymbolsArray, setBestSymbolsArray] = useState([]);
  const [uniqueSymbols, setUniqueSymbols] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStrategiesData([]);
    setStrategySummaries([]);
    setBestSymbolsArray([]);
    setUniqueSymbols([]);

    try {
      const params = {
        stop_loss_pct: stopLossPct,
        take_profit_pct: takeProfitPct,
        valor
      };
      const { data } = await mlApi.get('/backtest_results/by_strategy_detailed', { params });

      if (data && Array.isArray(data.strategies)) {
        const n = parseInt(nActions, 10) || 40;

        const newStrategies = [];
        const summaries = [];
        const bestSymbols = [];
        const allSymbols = [];

        data.strategies.forEach((st) => {
          const { strategy_name, actions } = st;

          // 1) Filtrar las operaciones SHORT en símbolos que terminen con 34, 33 o 39
          //    Si se descartan todas las ops => valor_final = valor_inicial (sin operar).
          const filteredActions = actions.map((act) => {
            // Revisa si symbol termina con '34', '33' o '39'
            const ends34or33or39 = /(?:34|33|39)$/.test(act.symbol);

            if (!act.operations || act.operations.length === 0) {
              // No hay ops, no filtramos nada
              return act;
            }

            // Filtramos ops:
            const newOps = act.operations.filter((op) => {
              if (ends34or33or39 && op.position_type === 'SHORT') {
                // descartar
                return false;
              }
              // mantenerla
              return true;
            });

            let newValorFinal = act.valor_final;
            if (newOps.length === 0) {
              // Se descartaron todas => no se opera => valor_final = valor_inicial
              newValorFinal = act.valor_inicial;
            }

            return {
              ...act,
              operations: newOps,
              valor_final: newValorFinal
            };
          });

          // 2) Ordenar por valor_final desc
          filteredActions.sort((a, b) => b.valor_final - a.valor_final);

          // 3) topN / bottomN
          const top = filteredActions.slice(0, n);
          const bottom = filteredActions.slice(-n);

          // 4) Resumen global
          let wins = 0;
          let losses = 0;
          let totalInitial = 0;
          let totalFinal = 0;

          filteredActions.forEach((act) => {
            totalInitial += act.valor_inicial;
            totalFinal += act.valor_final;
            if (act.valor_final > act.valor_inicial) {
              wins++;
            } else if (act.valor_final < act.valor_inicial) {
              losses++;
            }
            // Add symbol to allSymbols
            allSymbols.push(act.symbol);
          });

          const diff = totalFinal - totalInitial;
          const summary = {
            strategy_name,
            totalActions: filteredActions.length,
            wins,
            losses,
            totalInitial,
            totalFinal,
            diff
          };
          summaries.push(summary);

          // 5) guardamos info en newStrategies
          newStrategies.push({
            strategy_name,
            topActions: top,
            bottomActions: bottom
          });

          // 6) bestSymbols => top N
          const bestSyms = top.map((act) => act.symbol);
          bestSymbols.push({
            strategy_name,
            bestSymbols: bestSyms
          });
        });

        // 7) Array unificado de símbolos sin duplicar
        const unique = [...new Set(allSymbols)];
        setUniqueSymbols(unique);

        // Final
        setStrategiesData(newStrategies);
        setStrategySummaries(summaries);
        setBestSymbolsArray(bestSymbols);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al consultar backtest_results/by_strategy_detailed');
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // FLATTEN Data (para export) 
  // ===========================
  const flattenData = () => {
    const rows = [];
    strategiesData.forEach((st) => {
      st.topActions.forEach((act) => {
        if (!uniqueSymbols.includes(act.symbol)) return;
        rows.push({
          strategy: st.strategy_name,
          ranking: 'TOP',
          symbol: act.symbol,
          valor_inicial: act.valor_inicial,
          valor_final: act.valor_final,
          porcentaje_final: act.porcentaje_final,
          operations_count: act.operations ? act.operations.length : 0
        });
      });
      st.bottomActions.forEach((act) => {
        if (!uniqueSymbols.includes(act.symbol)) return;
        rows.push({
          strategy: st.strategy_name,
          ranking: 'BOTTOM',
          symbol: act.symbol,
          valor_inicial: act.valor_inicial,
          valor_final: act.valor_final,
          porcentaje_final: act.porcentaje_final,
          operations_count: act.operations ? act.operations.length : 0
        });
      });
    });
    return rows;
  };

  const csvHeaders = [
    { label: 'Strategy', key: 'strategy' },
    { label: 'Ranking', key: 'ranking' },
    { label: 'Symbol', key: 'symbol' },
    { label: 'Valor Inicial', key: 'valor_inicial' },
    { label: 'Valor Final', key: 'valor_final' },
    { label: 'Porcentaje Final', key: 'porcentaje_final' },
    { label: 'Operations Count', key: 'operations_count' },
  ];
  const csvData = flattenData();

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Strategies');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `strategies_result_${new Date().toISOString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      'Strategy', 'Ranking', 'Symbol',
      'Ini', 'Fin', '%Fin', '#Ops'
    ];
    const tableRows = [];

    csvData.forEach((row) => {
      tableRows.push([
        row.strategy,
        row.ranking,
        row.symbol,
        row.valor_inicial,
        row.valor_final,
        row.porcentaje_final,
        row.operations_count
      ]);
    });

    doc.text('Reporte Estrategias Gains', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 }
    });
    doc.save(`strategies_result_${new Date().toISOString()}.pdf`);
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <div>
      <h2>Strategy Gains</h2>
      <p>
        GET <code>{import.meta.env.VITE_API_SERVICE}/backtest_results/by_strategy_detailed</code> 
        con <code>stop_loss_pct, take_profit_pct, valor</code>.
      </p>

      <form onSubmit={handleSubmit} className="row g-3 mb-3">
        <div className="col-md-2">
          <label>Stop Loss %</label>
          <input
            className="form-control"
            value={stopLossPct}
            onChange={(e) => setStopLossPct(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Take Profit %</label>
          <input
            className="form-control"
            value={takeProfitPct}
            onChange={(e) => setTakeProfitPct(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Valor</label>
          <input
            className="form-control"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <label>Top/Bottom N</label>
          <input
            className="form-control"
            value={nActions}
            onChange={(e) => setNActions(e.target.value)}
          />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="hideOpsCheck"
              checked={hideOps}
              onChange={(e) => setHideOps(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="hideOpsCheck">
              Ocultar operaciones
            </label>
          </div>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button type="submit" className="btn btn-primary">
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger">Error: {error}</div>}

      {strategiesData.length > 0 && !loading && (
        <div className="mt-3">
          {/* Botones Export */}
          <div className="d-flex gap-2 mb-3">
            <CSVLink
              headers={csvHeaders}
              data={csvData}
              filename={`strategies_result_${new Date().toISOString()}.csv`}
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

          <h3>Resumen Global por Estrategia</h3>
          {strategySummaries.map((sum, idx) => (
            <div key={idx} className="mb-2">
              <strong>Estrategia:</strong> {sum.strategy_name} <br />
              <strong>Total Acciones:</strong> {sum.totalActions} <br />
              <strong>Aciertos:</strong> {sum.wins} | <strong>Erradas:</strong> {sum.losses} <br />
              <strong>Monto Inicial (sum):</strong> {sum.totalInitial.toFixed(2)} <br />
              <strong>Monto Final (sum):</strong> {sum.totalFinal.toFixed(2)} <br />
              <strong>Ganancia/Pérdida:</strong> {sum.diff.toFixed(2)} <br />
            </div>
          ))}

          <h3>Mejores Acciones (Top N) por Estrategia (Array)</h3>
          <pre>{JSON.stringify(bestSymbolsArray, null, 2)}</pre>

          <h4>Array Unificado de Símbolos (sin duplicados)</h4>
          <pre>{JSON.stringify(uniqueSymbols, null, 2)}</pre>

          {strategiesData.map((st, sIdx) => (
            <div key={sIdx} className="mb-4">
              <h4>Estrategia: {st.strategy_name}</h4>

              {/* Top */}
              <p><strong>Top {nActions} (mejores):</strong></p>
              <ul>
                {st.topActions
                  .filter((act) => uniqueSymbols.includes(act.symbol))
                  .map((act, i) => (
                    <li key={i}>
                      <strong>{act.symbol}</strong> | Ini: {act.valor_inicial} | 
                      Fin: {act.valor_final} | %Final: {act.porcentaje_final}
                      {!hideOps && act.operations && act.operations.length > 0 && (
                        <ul>
                          {act.operations.map((op, opIdx) => (
                            <li key={opIdx}>
                              {op.open_date} - {op.close_date} | {op.position_type} | 
                              PctChange: {op.pct_change}% | Valor: {op.valor_res}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))
                }
              </ul>

              {/* Bottom */}
              <p><strong>Bottom {nActions} (peores):</strong></p>
              <ul>
                {st.bottomActions
                  .filter((act) => uniqueSymbols.includes(act.symbol))
                  .map((act, i) => (
                    <li key={i}>
                      <strong>{act.symbol}</strong> | Ini: {act.valor_inicial} | 
                      Fin: {act.valor_final} | %Final: {act.porcentaje_final}
                      {!hideOps && act.operations && act.operations.length > 0 && (
                        <ul>
                          {act.operations.map((op, opIdx) => (
                            <li key={opIdx}>
                              {op.open_date} - {op.close_date} | {op.position_type} | 
                              PctChange: {op.pct_change}% | Valor: {op.valor_res}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))
                }
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StrategyGainPage;

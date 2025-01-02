// src/pages/DailyMlPredictionPage.jsx
import React, { useState, useEffect } from 'react';
import mlApi from '../services/mlApi';

// Para exportar CSV, Excel, PDF
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// IMPORTAMOS LA LISTA DE SÍMBOLOS:
import symbolsList from '../assets/symbolsList.json';

function DailyMlPredictionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Estructura final que mostramos en pantalla:
   * [
   *   {
   *     symbol: 'BBAS3',
   *     action: 'COMPRAR',  // (o 'VENDER')
   *     date: '2024-12-30 21:07:36'
   *   },
   *   ...
   * ]
   */
  const [predictions, setPredictions] = useState([]);

  // Si deseas, puedes confirmar que symbolsList se ha leído:
  // console.log("Symbols from JSON:", symbolsList.symbols);

  const handleGetPrediction = async () => {
    setLoading(true);
    setError(null);
    setPredictions([]);

    try {
      // 1) Preparar body a POST
      // Usamos symbolsList.symbols, que viene de symbolsList.json
      const body = {
        symbols: symbolsList.symbols || [],
      };

      // 2) Llamamos al endpoint POST /dailyPrediction con el body
      // "mlApi" está configurado para baseURL => import.meta.env.VITE_API_SERVICE
      const { data } = await mlApi.post('/dailyPrediction', body);
      // data.results: array con { symbol, date, features, prediction, prediction_name, error? }

      // 3) Filtramos según la regla:
      // - si prediction = 2 => COMPRAR
      // - si prediction = 0 => VENDER
      // - si error => ignorar
      // - si prediction = 1 => ignorar
      const filtered = [];
      if (data && Array.isArray(data.results)) {
        data.results.forEach((item) => {
          if (item.error) {
            // ignoramos
            return;
          }
          if (item.prediction === 0) {
            filtered.push({
              symbol: item.symbol,
              date: item.date || '',
              action: 'VENDER',
            });
          } else if (item.prediction === 2) {
            filtered.push({
              symbol: item.symbol,
              date: item.date || '',
              action: 'COMPRAR',
            });
          }
        });
      }

      setPredictions(filtered);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al consultar dailyPrediction');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EXPORTAR CSV / EXCEL / PDF
  // =========================================================

  // Estructura "plana" para exportar
  // Symbol, Action, Date
  const csvHeaders = [
    { label: 'Symbol', key: 'symbol' },
    { label: 'Action', key: 'action' },
    { label: 'Date', key: 'date' },
  ];

  const csvData = predictions.map((p) => ({
    symbol: p.symbol,
    action: p.action,
    date: p.date,
  }));

  // 1) Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DailyPrediction');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `daily_prediction_${new Date().toISOString()}.xlsx`);
  };

  // 2) PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Symbol', 'Action', 'Date'];
    const tableRows = [];

    predictions.forEach((p) => {
      tableRows.push([p.symbol, p.action, p.date]);
    });

    doc.text('Reporte Daily Prediction', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save(`daily_prediction_${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h2>Daily ML Predictions</h2>
      <p>POST /dailyPrediction en: <code>{import.meta.env.VITE_API_SERVICE}/dailyPrediction</code></p>
      <p>Enviando los símbolos desde <code>symbolsList.json</code>.</p>

      <button
        onClick={handleGetPrediction}
        className="btn btn-primary mb-3"
        disabled={loading}
      >
        {loading ? 'Consultando...' : 'Obtener Predicciones'}
      </button>

      {error && <div className="alert alert-danger">Error: {error}</div>}

      {/* Mostramos la tabla con los resultados COMPRAR / VENDER */}
      {predictions.length > 0 && !loading && (
        <div className="mt-3">
          <h4>Acciones con predicción de Compra/Venta</h4>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Acción</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.symbol}</td>
                  <td>{p.action}</td>
                  <td>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Botones Export */}
          <div className="mt-3 d-flex gap-2">
            {/* CSV */}
            <CSVLink
              headers={csvHeaders}
              data={csvData}
              filename={`daily_prediction_${new Date().toISOString()}.csv`}
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

export default DailyMlPredictionPage;

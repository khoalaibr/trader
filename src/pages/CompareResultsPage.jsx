// src/pages/CompareResultsPage.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';

// Librerías para exportar
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Estructura de columnas que esperamos en cada CSV:
// Symbol, Total Trades, Avg ProfitLoss, Winners, Losers, Win Rate

function CompareResultsPage() {
  // Guardaremos la data parseada de cada archivo CSV
  const [csvData1, setCsvData1] = useState([]);
  const [csvData2, setCsvData2] = useState([]);
  const [csvData3, setCsvData3] = useState([]);
  const [csvData4, setCsvData4] = useState([]);

  // Resultado final tras combinar
  const [combinedResults, setCombinedResults] = useState([]);
  // JSON con acciones que tienen >2% de avgProfitLoss y >50% de winRate
  const [filteredJson, setFilteredJson] = useState([]);

  // Manejo de archivos
  const handleFileChange = (e, setCsvFn) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,    // Para que tome la primera fila como encabezados
      skipEmptyLines: true,
      complete: (results) => {
        // results.data será un array de objetos con keys según el header
        // Por ejemplo: {Symbol, Total Trades, Avg ProfitLoss, Winners, Losers, Win Rate}
        const parsed = results.data.map((row) => ({
          symbol: row['Symbol']?.trim(),
          totalTrades: Number(row['TotalTrades']) || 0,
          avgProfitLoss: parseFloat(row['AvgProfitLoss']) || 0,
          winners: Number(row['Winners']) || 0,
          losers: Number(row['Losers']) || 0,
          winRate: parseFloat(row['WinRate']) || 0,
        }));

        setCsvFn(parsed);
      },
    });
  };

  // Una función para "combinar" la data de los 4 CSV en un solo reporte
  const combineResults = () => {
    // Queremos un objeto con key = symbol, y value = array con data para cada CSV
    // Posteriormente sacamos los 4 datos del symbol, y mostramos (AvgProfitLoss, WinRate)
    // Suponiendo que cada CSV puede o no tener el mismo set de símbolos

    const symbolsSet = new Set([
      ...csvData1.map((d) => d.symbol),
      ...csvData2.map((d) => d.symbol),
      ...csvData3.map((d) => d.symbol),
      ...csvData4.map((d) => d.symbol),
    ]);

    const combined = [];

    symbolsSet.forEach((sym) => {
      // Buscar el entry de cada CSV
      const csv1Sym = csvData1.find((c) => c.symbol === sym);
      const csv2Sym = csvData2.find((c) => c.symbol === sym);
      const csv3Sym = csvData3.find((c) => c.symbol === sym);
      const csv4Sym = csvData4.find((c) => c.symbol === sym);

      // Rescatamos AvgProfitLoss y WinRate si existe
      // (caso contrario, 0 o NaN)
      const avgPL1 = csv1Sym?.avgProfitLoss || 0;
      const avgPL2 = csv2Sym?.avgProfitLoss || 0;
      const avgPL3 = csv3Sym?.avgProfitLoss || 0;
      const avgPL4 = csv4Sym?.avgProfitLoss || 0;

      const wr1 = csv1Sym?.winRate || 0;
      const wr2 = csv2Sym?.winRate || 0;
      const wr3 = csv3Sym?.winRate || 0;
      const wr4 = csv4Sym?.winRate || 0;

      // Podrías mostrar totalTrades también, si lo deseas

      combined.push({
        symbol: sym,
        avgPL1,
        avgPL2,
        avgPL3,
        avgPL4,
        wr1,
        wr2,
        wr3,
        wr4,
      });
    });

    // Sumar los promedios final
    // En este caso, interpretaremos que quieres "promediar" los 4 CSV de cada símbolo:
    // Es decir, un "AvgProfitLoss overall" = (avgPL1 + avgPL2 + avgPL3 + avgPL4) / 4 (siempre 4 CSV).
    // Lo mismo con "WinRate overall" = (wr1 + wr2 + wr3 + wr4) / 4

    const combinedWithOverall = combined.map((item) => {
      const avgPLoverall = (item.avgPL1 + item.avgPL2 + item.avgPL3 + item.avgPL4) / 4;
      const wrOverall = (item.wr1 + item.wr2 + item.wr3 + item.wr4) / 4;
      return {
        ...item,
        avgPLoverall,
        wrOverall,
      };
    });

    // Ordenamos descendente por avgPLoverall
    combinedWithOverall.sort((a, b) => b.avgPLoverall - a.avgPLoverall);

    // Generar la lista filtrada: avgPL > 2 y wr > 50
    const filtered = combinedWithOverall.filter(
      (x) => x.avgPLoverall >= 2 && x.wrOverall >= 50
    );

    setFilteredJson(filtered);
    setCombinedResults(combinedWithOverall);
  };

  // Para exportar, necesitamos formatear la data
  // 1) CSV
  const csvHeaders = [
    { label: 'Symbol', key: 'symbol' },
    { label: 'AvgPL1', key: 'avgPL1' },
    { label: 'AvgPL2', key: 'avgPL2' },
    { label: 'AvgPL3', key: 'avgPL3' },
    { label: 'AvgPL4', key: 'avgPL4' },
    { label: 'WR1', key: 'wr1' },
    { label: 'WR2', key: 'wr2' },
    { label: 'WR3', key: 'wr3' },
    { label: 'WR4', key: 'wr4' },
    { label: 'AvgPLOverall', key: 'avgPLoverall' },
    { label: 'WinRateOverall', key: 'wrOverall' },
  ];

  const csvData = combinedResults.map((c) => ({
    symbol: c.symbol,
    avgPL1: c.avgPL1.toFixed(2),
    avgPL2: c.avgPL2.toFixed(2),
    avgPL3: c.avgPL3.toFixed(2),
    avgPL4: c.avgPL4.toFixed(2),
    wr1: c.wr1.toFixed(2),
    wr2: c.wr2.toFixed(2),
    wr3: c.wr3.toFixed(2),
    wr4: c.wr4.toFixed(2),
    avgPLoverall: c.avgPLoverall.toFixed(2),
    wrOverall: c.wrOverall.toFixed(2),
  }));

  // 2) Excel
  const exportToExcel = () => {
    const data = csvData; // ya formateado
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CompareResults');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `compare_results_${new Date().toISOString()}.xlsx`);
  };

  // 3) PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      'Symbol',
      'AvgPL1',
      'AvgPL2',
      'AvgPL3',
      'AvgPL4',
      'WR1',
      'WR2',
      'WR3',
      'WR4',
      'AvgPLOverall',
      'WinRateOverall',
    ];
    const tableRows = [];

    combinedResults.forEach((c) => {
      const row = [
        c.symbol,
        c.avgPL1.toFixed(2),
        c.avgPL2.toFixed(2),
        c.avgPL3.toFixed(2),
        c.avgPL4.toFixed(2),
        c.wr1.toFixed(2),
        c.wr2.toFixed(2),
        c.wr3.toFixed(2),
        c.wr4.toFixed(2),
        c.avgPLoverall.toFixed(2),
        c.wrOverall.toFixed(2),
      ];
      tableRows.push(row);
    });

    doc.text('Reporte Comparativo Resultados', 14, 20);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 7 }, // Reducir fuente si es muy ancho
    });
    doc.save(`compare_results_${new Date().toISOString()}.pdf`);
  };

  return (
    <div>
      <h2>Comparar Resultados</h2>
      <p>Sube 4 archivos CSV con columnas: <code>Symbol,Total Trades,Avg ProfitLoss,Winners,Losers,Win Rate</code></p>

      {/* Inputs para subir archivos */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label>Archivo 1</label>
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={(e) => handleFileChange(e, setCsvData1)}
          />
        </div>
        <div className="col-md-3">
          <label>Archivo 2</label>
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={(e) => handleFileChange(e, setCsvData2)}
          />
        </div>
        <div className="col-md-3">
          <label>Archivo 3</label>
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={(e) => handleFileChange(e, setCsvData3)}
          />
        </div>
        <div className="col-md-3">
          <label>Archivo 4</label>
          <input
            type="file"
            accept=".csv"
            className="form-control"
            onChange={(e) => handleFileChange(e, setCsvData4)}
          />
        </div>
      </div>

      <div className="mb-3">
        <button onClick={combineResults} className="btn btn-primary">
          Generar Reporte
        </button>
      </div>

      {/* Mostrar la tabla resultante */}
      {combinedResults.length > 0 && (
        <div className="mt-4">
          <h4>Resultados Combinados (Ordenados por AvgProfitLoss Overall)</h4>
          <table className="table table-striped table-sm">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>AvgPL1</th>
                <th>AvgPL2</th>
                <th>AvgPL3</th>
                <th>AvgPL4</th>
                <th>WR1</th>
                <th>WR2</th>
                <th>WR3</th>
                <th>WR4</th>
                <th>AvgPLOverall</th>
                <th>WinRateOverall</th>
              </tr>
            </thead>
            <tbody>
              {combinedResults.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.symbol}</td>
                  <td>{item.avgPL1.toFixed(2)}</td>
                  <td>{item.avgPL2.toFixed(2)}</td>
                  <td>{item.avgPL3.toFixed(2)}</td>
                  <td>{item.avgPL4.toFixed(2)}</td>
                  <td>{item.wr1.toFixed(2)}</td>
                  <td>{item.wr2.toFixed(2)}</td>
                  <td>{item.wr3.toFixed(2)}</td>
                  <td>{item.wr4.toFixed(2)}</td>
                  <td>{item.avgPLoverall.toFixed(2)}</td>
                  <td>{item.wrOverall.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 d-flex gap-2">
            <CSVLink
              headers={csvHeaders}
              data={csvData}
              filename={`compare_results_${new Date().toISOString()}.csv`}
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

      {filteredJson.length > 0 && (
        <div className="mt-4">
          <h4>Acciones (JSON) con AvgProfitLoss mayor 2% y Win Rate mayor 50%</h4>
          <pre>{JSON.stringify(filteredJson, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default CompareResultsPage;

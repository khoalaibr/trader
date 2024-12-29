Hemos estado trabajando en un sistema de trading. De lo que está resultando, hemos creado en el back, un modulo de analisis que me brindará abundante información, para trabajar con trading.
Lo que quiero de ti es que me ayudes a desarrollar un frontend que me ayude a visualizar mejor los resultados.
# Requerimientos
* Se llamará 'trader'
* Trabajaremos con React, con VITE.
* Sera una aplicacion escalable y que pretende crescer. Por lo tanto tambien manejaremos Redux.
* Piensa en algo escalable: Separa bien las constantes en un .env (por ejemplo la URL de mi app, que por ahora será 'localhost:3000'), separa todo lo que puedas en modulos, componentes, etc.
* Manejaremos AXIOS para las requisiciones.
* Utilizaremos bootstrap, para poder mantener una mejor usabilidad sin tener que pensar mucho en CSS
* Quiero que, a medida que vayas desarrollando, me vayas explicando con claridad lo que vas haciendo.
* No obvies ningun paso (ya sea de instalacion de libreria, creacion del proyecto o lo que sea). Trabajaré con npm.

# Sobre el proyecto
* La api la vengo desarrollando en NESTJS. Te voy a pasar los archivos necesarios para el analisis, a continuación, y tambien te voy a pasar los archivos relacionados con las consultas diarias. 
* Deberia contar con más de una pagina. Al menos una para el analisis y otra para las consultas diarias.
* La idea es que desde la pagina de analisis me dá la posibilidad de ejecutar los endpoints y me muestre los datos de una forma clara. Para que pueda leerlo e interpretarlos. Por otro lado, desde la pagina de consulta diaria, deberia poder ejecutar la consulta que me daria si, en determinado momento debo BUY/HOLD/SELL.


npx create-vite@latest trader --template react

cd trader
npm install

npm install bootstrap

npm install @reduxjs/toolkit react-redux

Crea una carpeta store dentro de src. Allí, crearemos un archivo store.js que configurará nuestro configureStore. Por ejemplo:

src/store/store.js:

import { configureStore } from '@reduxjs/toolkit';
import analysisReducer from '../store/features/analysisSlice';
import dailyConsultReducer from '../store/features/dailyConsultSlice';

export const store = configureStore({
  reducer: {
    analysis: analysisReducer,
    dailyConsult: dailyConsultReducer,
  },
});

export default store;

...........

// src/store/features/analysisSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  trades: [],
  stats: {},
  isLoading: false,
  error: null,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    setTradesAndStats(state, action) {
      state.trades = action.payload.trades;
      state.stats = action.payload.stats;
      state.isLoading = false;
    },
    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { startLoading, setTradesAndStats, setError } = analysisSlice.actions;
export default analysisSlice.reducer;

.........

trader/
└── src/
    ├── components/
    │   ├── Navbar.jsx
    │   ├── AnalysisFilterForm.jsx
    │   └── ...
    ├── pages/
    │   ├── AnalysisPage.jsx
    │   ├── DailyConsultPage.jsx
    │   └── HomePage.jsx
    ├── store/
    │   ├── features/
    │   │   ├── analysisSlice.js
    │   │   └── dailyConsultSlice.js
    │   └── store.js
    ├── services/
    │   └── api.js
    ├── App.jsx
    ├── main.jsx
    └── ...

............

// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import store from './store/store';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

..........

# .env
VITE_API_BASE_URL=http://localhost:3000

const baseUrl = import.meta.env.VITE_API_BASE_URL;


npm install jspdf jspdf-autotable

npm install xlsx file-saver

npm install react-csv


............




















Me guasta como va quedando la aplicacion en React. 
Pero no hace bien lo que propongo. 
Vamos primero a centrarno en el analisis.

Lo que busco con los endpoints que te pase es que haga lo siguiente:
'''
1) GET /analysis/trades: Devuelve la lista de trades que cumplan con los filtros y un pequeño resumen estadístico (promedio de P/L, cuántos ganan/pierden, etc.).
2) GET /analysis/compare-strategies: Hace un “ranking” de estrategias para un symbol dado (o para todos si no pasas symbol), ordenando por promedio de P/L.
3) GET /analysis/compare-symbols: Hace un “ranking” de símbolos para una strategy dada (o para todas si no pasas strategy), ordenando por promedio de P/L.
'''

Quizas en lugar de una sola pagina para analisis deberiamos contar con 3 paginas. Una para cada una de los endpoints. 
Pero quiero que se muestre todos. Que sea una excepcion mostrar solo una estrategia, por ejemplo. Pero que lo normal sea que muestre para todas las estrategias. Lo mismo para los periodos de tiempo y paraa las acciones. Que muestre todas salvo se complete algun campo. 
Como veras, los parametros son opcionales.

Te paso de nuevo el controlador, para que lo tomes en cuenta. 

'''
// src/modules/analysis/analysis.controller.ts

import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { ParseFloatPipe, ParseIntPipe } from '@nestjs/common';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * 1) Endpoint para obtener los trades filtrados y sus estadísticas.
   *    Ejemplo de uso:
   *    GET /analysis/trades?symbol=PETR4&strategy=FibonacciRsi&startDate=2023-01-01&endDate=2023-12-31&stopLoss=5&takeProfit=10
   */
  @Get('trades')
  async getTradesAndStats(
    @Query('symbol') symbol?: string,
    @Query('strategy') strategy?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('stopLoss') stopLossStr?: string,
    @Query('takeProfit') takeProfitStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate');
      }
    }
    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid endDate');
      }
    }

    const stopLoss = stopLossStr !== undefined ? parseFloat(stopLossStr) : undefined;
    const takeProfit = takeProfitStr !== undefined ? parseFloat(takeProfitStr) : undefined;

    const trades = await this.analysisService.findFilteredTrades(
      symbol,
      strategy,
      startDate,
      endDate,
      stopLoss,
      takeProfit,
    );
    const stats = this.analysisService.getTradeStats(trades);

    return {
      filters: {
        symbol,
        strategy,
        startDate,
        endDate,
        stopLoss,
        takeProfit,
      },
      totalTrades: stats.totalTrades,
      avgProfitLoss: stats.avgProfitLoss,
      winners: stats.winners,
      losers: stats.losers,
      winRate: stats.winRate,
      trades, // si deseas retornar la lista de trades
    };
  }

  /**
   * 2) Endpoint para comparar estrategias (promedio de trades) 
   *    para un mismo símbolo (o para todos si no se pasa el símbolo).
   *
   *    GET /analysis/compare-strategies?symbol=PETR4&startDate=2023-01-01&endDate=2023-12-31&stopLoss=2&takeProfit=5
   */
  @Get('compare-strategies')
  async compareStrategies(
    @Query('symbol') symbol?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('stopLoss') stopLossStr?: string,
    @Query('takeProfit') takeProfitStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate');
      }
    }
    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid endDate');
      }
    }
    const stopLoss = stopLossStr !== undefined ? parseFloat(stopLossStr) : undefined;
    const takeProfit = takeProfitStr !== undefined ? parseFloat(takeProfitStr) : undefined;

    const results = await this.analysisService.compareStrategies(
      symbol,
      startDate,
      endDate,
      stopLoss,
      takeProfit,
    );

    return { symbol: symbol ?? 'ALL', results };
  }

  /**
   * 3) Endpoint para comparar símbolos (promedio de trades)
   *    para una estrategia dada (o para todas).
   *
   *    GET /analysis/compare-symbols?strategy=FibonacciRsi&startDate=2023-01-01&endDate=2023-12-31
   */
  @Get('compare-symbols')
  async compareSymbols(
    @Query('strategy') strategy?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('stopLoss') stopLossStr?: string,
    @Query('takeProfit') takeProfitStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid startDate');
      }
    }
    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid endDate');
      }
    }
    const stopLoss = stopLossStr !== undefined ? parseFloat(stopLossStr) : undefined;
    const takeProfit = takeProfitStr !== undefined ? parseFloat(takeProfitStr) : undefined;

    const results = await this.analysisService.compareSymbols(
      strategy,
      startDate,
      endDate,
      stopLoss,
      takeProfit,
    );

    return { strategy: strategy ?? 'ALL', results };
  }
}


'''




























































Que posibilidad hay, para las paginas que me acabas de pasar (por las dudas te las repito abajo) de crear una especie de reporte (ya sea pdf, excel o csv) para que me lo pueda bajar y estudiar mejor. 
'''
// src/pages/AnalysisTradesPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrades } from '../store/features/analysisSlice';

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
        </div>
      )}
    </div>
  );
}

export default AnalysisTradesPage;

'''
'''
// src/pages/CompareStrategiesPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compareStrategies } from '../store/features/analysisSlice';

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
          <button className="btn btn-primary">
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
        </div>
      )}
    </div>
  );
}

export default CompareStrategiesPage;

'''
'''
// src/pages/CompareSymbolsPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compareSymbols } from '../store/features/analysisSlice';

function CompareSymbolsPage() {
  const dispatch = useDispatch();
  const { compareSymbolsData, loading, error } = useSelector((state) => state.analysis);

  // Filtros (todos opcionales)
  const [strategy, setStrategy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      compareSymbols({
        strategy: strategy || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      })
    );
  };

  return (
    <div>
      <h2>Comparar Acciones</h2>
      <p>Este endpoint: <code>GET /analysis/compare-symbols</code></p>
      <form onSubmit={handleSubmit} className="row g-3">
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
          <button className="btn btn-primary">
            {loading ? 'Consultando...' : 'Comparar Symbols'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger mt-3">Error: {JSON.stringify(error)}</div>}

      {compareSymbolsData && !loading && (
        <div className="mt-4">
          <h4>Resultados para strategy: {compareSymbolsData.strategy}</h4>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Total Trades</th>
                <th>Avg ProfitLoss</th>
                <th>Winners</th>
                <th>Losers</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {compareSymbolsData.results.map((res, idx) => (
                <tr key={idx}>
                  <td>{res.symbol}</td>
                  <td>{res.totalTrades}</td>
                  <td>{res.avgProfitLoss}</td>
                  <td>{res.winners}</td>
                  <td>{res.losers}</td>
                  <td>{res.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CompareSymbolsPage;

'''
'''
// src/store/features/analysisSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * 1) Llama GET /analysis/trades
 */
export const fetchTrades = createAsyncThunk(
  'analysis/fetchTrades',
  async (filters, { rejectWithValue }) => {
    try {
      const { symbol, strategy, startDate, endDate, stopLoss, takeProfit } = filters || {};

      const params = {};
      if (symbol) params.symbol = symbol;
      if (strategy) params.strategy = strategy;
      if (startDate) params.startDate = startDate; // "YYYY-MM-DD" o como venga
      if (endDate) params.endDate = endDate;
      if (stopLoss !== undefined) params.stopLoss = stopLoss;
      if (takeProfit !== undefined) params.takeProfit = takeProfit;

      const response = await api.get('/analysis/trades', { params });
      return response.data; // {filters, totalTrades, avgProfitLoss, winners, losers, winRate, trades}
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 2) Llama GET /analysis/compare-strategies
 */
export const compareStrategies = createAsyncThunk(
  'analysis/compareStrategies',
  async (filters, { rejectWithValue }) => {
    try {
      const { symbol, startDate, endDate, stopLoss, takeProfit } = filters || {};

      const params = {};
      if (symbol) params.symbol = symbol;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (stopLoss !== undefined) params.stopLoss = stopLoss;
      if (takeProfit !== undefined) params.takeProfit = takeProfit;

      const response = await api.get('/analysis/compare-strategies', { params });
      return response.data; // { symbol, results: [...] }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 3) Llama GET /analysis/compare-symbols
 */
export const compareSymbols = createAsyncThunk(
  'analysis/compareSymbols',
  async (filters, { rejectWithValue }) => {
    try {
      const { strategy, startDate, endDate, stopLoss, takeProfit } = filters || {};

      const params = {};
      if (strategy) params.strategy = strategy;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (stopLoss !== undefined) params.stopLoss = stopLoss;
      if (takeProfit !== undefined) params.takeProfit = takeProfit;

      const response = await api.get('/analysis/compare-symbols', { params });
      return response.data; // { strategy, results: [...] }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  tradesData: null,         // Resultado de /analysis/trades
  compareStrategiesData: null, // Resultado de /analysis/compare-strategies
  compareSymbolsData: null,    // Resultado de /analysis/compare-symbols

  loading: false,
  error: null,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Podrías poner reducers sincrónicos aquí si lo deseas
  },
  extraReducers: (builder) => {
    /** fetchTrades */
    builder
      .addCase(fetchTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.tradesData = action.payload; // Objeto con {filters, totalTrades, avgProfitLoss, ...}
      })
      .addCase(fetchTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /** compareStrategies */
    builder
      .addCase(compareStrategies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(compareStrategies.fulfilled, (state, action) => {
        state.loading = false;
        state.compareStrategiesData = action.payload; 
      })
      .addCase(compareStrategies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /** compareSymbols */
    builder
      .addCase(compareSymbols.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(compareSymbols.fulfilled, (state, action) => {
        state.loading = false;
        state.compareSymbolsData = action.payload; 
      })
      .addCase(compareSymbols.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default analysisSlice.reducer;

'''












































Me parece genial el cambio que le hiciste a AnalysistradePage, para que genere los 3 botones de descarga (CSV, PDF y EXCEL).
Te lo paso para que lo recuerdes:
'''
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

  // Filtros
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
        {/* ... Tus inputs ... */}
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

'''
El tema es que te has olvidado de colocar los inputs opcionales
Te paso el archivo anterior, como estaba, para que lo tomes en cuenta:
'''
// src/pages/AnalysisTradesPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrades } from '../store/features/analysisSlice';

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
        </div>
      )}
    </div>
  );
}

export default AnalysisTradesPage;

'''
Si puedes arreglarlo, para que se pueda descargar las 3 opciones, pero tambien tenga los botones de descarga.
...
Por otro lado, me gusstaria hacer lo mismo con las otras paginas, 
pero prefiero que lo hagas tu, para no haber errores.
Te las paso a continuación:
'''
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
          <button className="btn btn-primary">
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
        </div>
      )}
    </div>
  );
}

export default CompareStrategiesPage;

'''
'''
// src/pages/CompareSymbolsPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compareSymbols } from '../store/features/analysisSlice';

function CompareSymbolsPage() {
  const dispatch = useDispatch();
  const { compareSymbolsData, loading, error } = useSelector((state) => state.analysis);

  // Filtros (todos opcionales)
  const [strategy, setStrategy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      compareSymbols({
        strategy: strategy || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      })
    );
  };

  return (
    <div>
      <h2>Comparar Acciones</h2>
      <p>Este endpoint: <code>GET /analysis/compare-symbols</code></p>
      <form onSubmit={handleSubmit} className="row g-3">
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
          <button className="btn btn-primary">
            {loading ? 'Consultando...' : 'Comparar Symbols'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger mt-3">Error: {JSON.stringify(error)}</div>}

      {compareSymbolsData && !loading && (
        <div className="mt-4">
          <h4>Resultados para strategy: {compareSymbolsData.strategy}</h4>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Total Trades</th>
                <th>Avg ProfitLoss</th>
                <th>Winners</th>
                <th>Losers</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {compareSymbolsData.results.map((res, idx) => (
                <tr key={idx}>
                  <td>{res.symbol}</td>
                  <td>{res.totalTrades}</td>
                  <td>{res.avgProfitLoss}</td>
                  <td>{res.winners}</td>
                  <td>{res.losers}</td>
                  <td>{res.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CompareSymbolsPage;

'''

Podrias hacer las modificaciones debidas y pasarme nuevamente los archivos modificados, completos.
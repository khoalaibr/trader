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

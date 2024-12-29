// src/store/features/dailyConsultSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLiveSignal = createAsyncThunk(
  'dailyConsult/fetchLiveSignal',
  async (filters, { rejectWithValue }) => {
    try {
      const { symbol, startDate, endDate, strategy, stopLoss, takeProfit } = filters;
      const params = {};
      if (symbol) params.symbol = symbol;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (strategy) params.strategy = strategy;
      if (stopLoss !== undefined) params.stopLoss = stopLoss;
      if (takeProfit !== undefined) params.takeProfit = takeProfit;

      const response = await api.get('/backtest/liveSignal', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const dailyConsultSlice = createSlice({
  name: 'dailyConsult',
  initialState: {
    liveSignalResult: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveSignal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveSignal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.liveSignalResult = action.payload;
      })
      .addCase(fetchLiveSignal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default dailyConsultSlice.reducer;

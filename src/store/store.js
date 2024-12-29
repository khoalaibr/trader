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

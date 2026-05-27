// mobile/src/store/slices/historySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { historyApi } from '../../api/history';

export const fetchHistory = createAsyncThunk(
  'history/fetchHistory',
  async ({ page = 1, pageSize = 20 }, { rejectWithValue }) => {
    try {
      const result = await historyApi.getHistory(page, pageSize);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchScanDetail = createAsyncThunk(
  'history/fetchScanDetail',
  async (scanId, { rejectWithValue }) => {
    try {
      const result = await historyApi.getScanDetail(scanId);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteScanHistory = createAsyncThunk(
  'history/deleteScan',
  async (scanId, { rejectWithValue }) => {
    try {
      await historyApi.deleteScan(scanId);
      return scanId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchScanStats = createAsyncThunk(
  'history/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const result = await historyApi.getScanStats();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  currentDetail: null,
  stats: null,
  status: 'idle',
  error: null,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistory: (state) => {
      state.items = [];
      state.total = 0;
      state.page = 1;
    },
    
    clearCurrentDetail: (state) => {
      state.currentDetail = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.page_size;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      .addCase(fetchScanDetail.fulfilled, (state, action) => {
        state.currentDetail = action.payload;
      })
      
      .addCase(deleteScanHistory.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.id !== action.payload
        );
        state.total -= 1;
      })
      
      .addCase(fetchScanStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearHistory, clearCurrentDetail } = historySlice.actions;

export const selectHistory = (state) => state.history;
export const selectHistoryItems = (state) => state.history.items;
export const selectCurrentDetail = (state) => state.history.currentDetail;
export const selectScanStats = (state) => state.history.stats;

export default historySlice.reducer;
// mobile/src/store/slices/analysisSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analysisApi } from '../../api/analysis';

export const analyzeImage = createAsyncThunk(
  'analysis/analyzeImage',
  async (imageUri, { rejectWithValue }) => {
    try {
      const result = await analysisApi.analyzeImage(imageUri);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  status: 'idle',
  currentAnalysis: null,
  rawText: null,
  error: null,
  recentAnalyses: [],
  uploadProgress: 0,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearCurrentAnalysis: (state) => {
      state.currentAnalysis = null;
      state.rawText = null;
      state.error = null;
      state.status = 'idle';
      state.uploadProgress = 0;
    },
    
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    
    addToRecentAnalyses: (state, action) => {
      state.recentAnalyses.unshift({
        ...action.payload,
        timestamp: Date.now(),
      });
      
      if (state.recentAnalyses.length > 50) {
        state.recentAnalyses.pop();
      }
    },
    
    clearRecentAnalyses: (state) => {
      state.recentAnalyses = [];
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(analyzeImage.pending, (state) => {
        state.status = 'uploading';
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(analyzeImage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentAnalysis = action.payload;
        state.rawText = action.payload.raw_text || null;
        state.error = null;
        state.uploadProgress = 100;
        
        state.recentAnalyses.unshift({
          ...action.payload,
          timestamp: Date.now(),
        });
      })
      .addCase(analyzeImage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Analysis failed';
        state.uploadProgress = 0;
      });
  },
});

export const {
  clearCurrentAnalysis,
  setUploadProgress,
  addToRecentAnalyses,
  clearRecentAnalyses,
} = analysisSlice.actions;

export const selectCurrentAnalysis = (state) => state.analysis.currentAnalysis;
export const selectAnalysisStatus = (state) => state.analysis.status;
export const selectAnalysisError = (state) => state.analysis.error;
export const selectUploadProgress = (state) => state.analysis.uploadProgress;

export default analysisSlice.reducer;
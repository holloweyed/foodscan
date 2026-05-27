// mobile/src/hooks/useAnalysis.js
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  analyzeImage,
  selectCurrentAnalysis,
  selectAnalysisStatus,
  selectAnalysisError,
  clearCurrentAnalysis,
} from '../store/slices/analysisSlice';
import { addToRecentAnalyses } from '../store/slices/analysisSlice';

export const useAnalysis = () => {
  const dispatch = useDispatch();
  const currentAnalysis = useSelector(selectCurrentAnalysis);
  const status = useSelector(selectAnalysisStatus);
  const error = useSelector(selectAnalysisError);
  
  const [localStatus, setLocalStatus] = useState('idle');
  
  const analyze = useCallback(async (imageUri) => {
    setLocalStatus('processing');
    
    try {
      const result = await dispatch(analyzeImage(imageUri)).unwrap();
      setLocalStatus('completed');
      return result;
    } catch (error) {
      setLocalStatus('error');
      throw error;
    }
  }, [dispatch]);
  
  const clearAnalysis = useCallback(() => {
    dispatch(clearCurrentAnalysis());
    setLocalStatus('idle');
  }, [dispatch]);
  
  const getSafetySummary = useCallback(() => {
    if (!currentAnalysis?.safety_summary) return null;
    
    const summary = currentAnalysis.safety_summary;
    
    if (summary.banned_count > 0) {
      return {
        level: 'banned',
        message: 'Product contains banned additives',
        color: '#c0392b',
      };
    }
    
    if (summary.dangerous_count > 0) {
      return {
        level: 'dangerous',
        message: 'Product contains dangerous additives',
        color: '#e74c3c',
      };
    }
    
    if (summary.moderate_count > 0) {
      return {
        level: 'moderate',
        message: 'Product may require attention',
        color: '#f39c12',
      };
    }
    
    return {
      level: 'safe',
      message: 'Product appears to be safe',
      color: '#27ae60',
    };
  }, [currentAnalysis]);
  
  return {
    analyze,
    clearAnalysis,
    currentAnalysis,
    status: localStatus,
    error,
    getSafetySummary,
    isLoading: localStatus === 'processing',
    isCompleted: localStatus === 'completed',
    isError: localStatus === 'error',
  };
};
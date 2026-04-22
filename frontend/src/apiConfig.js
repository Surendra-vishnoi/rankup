/**
 * API configuration for the RankUp platform.
 * 
 * In development, this points to localhost:5000.
 * In production (Render), this should be an empty string if served from the same domain,
 * OR the full URL of the backend service if separated.
 */
export const API_BASE = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') 
  : 'http://localhost:5000';

// src/api/index.js
import axios from 'axios';

// All requests to /api will be proxied to http://localhost:8080/api by your Vite proxy.
export const api = axios.create({ baseURL: '/api' });

// Call to insert a row into a given table
export function addRow(tableName, rowData) {
  return api.post(`/tables/${encodeURIComponent(tableName)}/rows`, rowData);
}

// Call to fetch all rows for a given table (you can add this if you like)
export function listRows(tableName) {
  return api.get(`/tables/${encodeURIComponent(tableName)}/rows`)
            .then(res => res.data);
}

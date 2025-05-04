// src/App.jsx
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import BusinessEntity from './pages/BusinessEntity'
import './index.css'   // your Tailwind entrypoint
import React from 'react';

import DynamicTableManager from './pages/BusinessEntity';
import TablePage           from './pages/TablePage';

function Sidebar() {
  const { pathname } = useLocation()
  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/templates', label: 'Templates' },
    { to: '/business-entity', label: 'Business Entity' },
    { to: '/preview', label: 'Preview & Export' },
  ]

  return (
    <aside className="w-64 bg-blue-900 text-white p-6 flex-shrink-0">
      <nav className="space-y-4">
        {nav.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={
              `block text-lg hover:text-gray-200 ` +
              (pathname === item.to
                ? 'bg-blue-700 px-4 py-2 rounded'
                : '')
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-8">
          <Routes>
            <Route path="/business-entity" element={<BusinessEntity />} />
            {/* <Route path="/"         element={<Dashboard />} /> */}
            {/* <Route path="/templates" element={<Templates />} /> */}
            {/* <Route path="/preview"   element={<PreviewExport />} /> */}
            <Route path="/"                element={<DynamicTableManager />} />
      <Route path="/tables/:tableName" element={<TablePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

import React from 'react';

export default function TableSelector({ tables, onSelect }) {
  return (
    <select onChange={e => onSelect(e.target.value)}>
      <option value="">— pick a table —</option>
      {tables.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

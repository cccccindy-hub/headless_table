// // src/pages/TablePage.jsx
// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// // import { /* maybe listRowsForTable */ } from '../api'; // if you have an API fn

// export default function TablePage() {
//   const { tableName } = useParams();
//   const [rows, setRows] = useState([]);

//   useEffect(() => {
//     // if you have a fetch function, call it here:
//     // listRowsForTable(tableName).then(setRows);
//   }, [tableName]);

//   return (
//     <div>
//       <h1>Table: {tableName}</h1>
//       {rows.length === 0 
//         ? <p>No data yet.</p>
//         : (
//           <table>
//             <thead>
//               <tr>
//                 {Object.keys(rows[0]).map(col => <th key={col}>{col}</th>)}
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((row, i) => (
//                 <tr key={i}>
//                   {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )
//       }
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listRows } from '../api';
import { addRow } from '../api';


const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '900px', margin: '2rem auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  select: { padding: '0.4rem', fontSize: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { border: '1px solid #ccc', padding: '0.6rem', background: '#f0f0f0' },
  td: { border: '1px solid #ccc', padding: '0.6rem' },
  button: { margin: '0.3rem', padding: '0.4rem 0.8rem' },
  textarea: { width: '100%', height: '120px', marginTop: '1rem', padding: '0.5rem', fontFamily: 'monospace' },
  section: { marginTop: '2rem' },
  log: { background: '#f7f7f7', padding: '1rem', borderRadius: '4px', marginTop: '2rem', whiteSpace: 'pre-wrap' }
};

const TablePage = () => {
  const [tableNames, setTableNames] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState([]);
  const [jsonInput, setJsonInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [log, setLog] = useState('');
  const { tableName } = useParams();
    const navigate = useNavigate();

  // load table list once
  useEffect(() => {
    fetch('/api/tables')
      .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then(list => {
        setTableNames(list);
        if (list.length) setSelectedTable(list[0]);
      })
      .catch(err => setLog(`List fetch error: ${err.message}`));
  }, []);

  // load rows when table changes
  useEffect(() => {
    if (!selectedTable) return;
    fetchRows();
  }, [selectedTable]);

  const fetchRows = () => {
    fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => setRows(data))
      .catch(err => setLog(`Row fetch error: ${err.message}`));
  };

  const handleAdd = () => {
    try {
      const body = JSON.parse(jsonInput);
      fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.text(); })
        .then(() => {
          setLog('Row added.');
          setJsonInput('');
          fetchRows();
        })
        .catch(err => setLog(`Add error: ${err.message}`));
    } catch (err) {
      setLog(`Invalid JSON: ${err.message}`);
    }
  };

  const handleEdit = row => {
    setJsonInput(JSON.stringify(row, null, 2));
    setEditing(true);
  };

  const handleUpdate = () => {
    try {
      const body = JSON.parse(jsonInput);
      fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.text(); })
        .then(() => {
          setLog('Row updated.');
          setJsonInput('');
          setEditing(false);
          fetchRows();
        })
        .catch(err => setLog(`Update error: ${err.message}`));
    } catch (err) {
      setLog(`Invalid JSON: ${err.message}`);
    }
  };

  const handleDelete = row => {
    if (!window.confirm('Really delete this row?')) return;
    fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    })
      .then(res => { if (!res.ok) throw new Error(res.status); return res.text(); })
      .then(() => {
        setLog('Row deleted.');
        fetchRows();
      })
      .catch(err => setLog(`Delete error: ${err.message}`));
  };

  return (
    <div style={styles.container}>
      {/* Header: Title and table selection dropdown */}
      <div style={styles.header}>
        <h1>Dynamic Table Editor</h1>
        <select
          style={styles.select}
          value={selectedTable}
          onChange={e => setSelectedTable(e.target.value)}
        >
          {/* Populate dropdown with available table names */}
          {tableNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Section: Display rows of the selected table */}
      <div style={styles.section}>
        <h2>Rows in {selectedTable}</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              {/* Dynamically render column headers from the first row */}
              {rows[0] && Object.keys(rows[0]).map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
              {/* Extra header for action buttons */}
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Render each row and its cells */}
            {rows.map((row, i) => (
              <tr key={i}>
                {Object.entries(row).map(([k, v]) => (
                  <td key={k} style={styles.td}>{String(v)}</td>
                ))}
                {/* Action buttons for editing or deleting this row */}
                <td style={styles.td}>
                  <button style={styles.button} onClick={() => handleEdit(row)}>Edit</button>
                  <button style={styles.button} onClick={() => handleDelete(row)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section: JSON editor for adding or updating a row */}
      <div style={styles.section}>
        <h2>{editing ? 'Edit' : 'Add'} Row</h2>
        <textarea
          style={styles.textarea}
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          placeholder='Enter row JSON here'
        />
        <div>
          {/* Show Add or Update/Cancel buttons based on editing state */}
          {!editing && (
            <button style={styles.button} onClick={handleAdd}>Add Row</button>
          )}
          {editing && (
            <>
              <button style={styles.button} onClick={handleUpdate}>Update Row</button>
              <button style={styles.button} onClick={() => { setJsonInput(''); setEditing(false); }}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* Log area: Display feedback messages */}
      <div style={styles.log}>
        {log}
      </div>
    </div>
  );
};

export default TablePage;
export function SpecificTablePage() {
    const { tableName } = useParams();
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [jsonInput, setJsonInput] = useState('');
    const [editing, setEditing] = useState(false);
    const [log, setLog] = useState('');
  
    // Fetch rows whenever tableName changes
    useEffect(() => {
      if (!tableName) return;
      fetch(`/api/tables/${encodeURIComponent(tableName)}/rows`)
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then(setRows)
        .catch(err => setLog(`Error loading rows: ${err.message}`));
    }, [tableName]);
  
    const handleAddOrUpdate = method => {
      try {
        const body = JSON.parse(jsonInput);
        fetch(`/api/tables/${encodeURIComponent(tableName)}/rows`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
          .then(res => {
            if (!res.ok) throw new Error(res.statusText);
            return res.text();
          })
          .then(() => {
            setLog(`${method === 'POST' ? 'Added' : 'Updated'} row.`);
            setJsonInput('');
            setEditing(false);
            // reload rows
            return fetch(`/api/tables/${encodeURIComponent(tableName)}/rows`);
          })
          .then(res => res.json())
          .then(setRows)
          .catch(err => setLog(`Error: ${err.message}`));
      } catch (err) {
        setLog(`Invalid JSON: ${err.message}`);
      }
    };
  
    const handleDelete = row => {
      if (!window.confirm('Confirm delete?')) return;
      fetch(`/api/tables/${encodeURIComponent(tableName)}/rows`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      })
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          return res.text();
        })
        .then(() => {
          setLog('Row deleted.');
          // reload
          return fetch(`/api/tables/${encodeURIComponent(tableName)}/rows`);
        })
        .then(res => res.json())
        .then(setRows)
        .catch(err => setLog(`Error: ${err.message}`));
    };
  
    const beginEdit = row => {
      setJsonInput(JSON.stringify(row, null, 2));
      setEditing(true);
    };
  
    return (
      <div style={specStyles.container}>
        <div style={specStyles.header}>
          <h1>Table: {tableName}</h1>
          <button style={specStyles.button} onClick={() => navigate('/')}>Back</button>
        </div>
  
        {/* Rows Table */}
        <div style={specStyles.section}>
          <h2>Rows</h2>
          <table style={specStyles.table}>
            <thead>
              <tr>
                {rows[0] && Object.keys(rows[0]).map(col => (
                  <th key={col} style={specStyles.th}>{col}</th>
                ))}
                <th style={specStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={specStyles.td}>{String(val)}</td>
                  ))}
                  <td style={specStyles.td}>
                    <button style={specStyles.button} onClick={() => beginEdit(row)}>Edit</button>
                    <button style={specStyles.button} onClick={() => handleDelete(row)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Add / Edit Form */}
        <div style={specStyles.section}>
          <h2>{editing ? 'Edit' : 'Add'} Row</h2>
          <textarea
            style={specStyles.textarea}
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder="Enter row JSON"
          />
          <div>
            {!editing && (
              <button style={specStyles.button} onClick={() => handleAddOrUpdate('POST')}>Add Row</button>
            )}
            {editing && (
              <>
                <button style={specStyles.button} onClick={() => handleAddOrUpdate('PUT')}>Update Row</button>
                <button style={specStyles.button} onClick={() => { setJsonInput(''); setEditing(false); }}>Cancel</button>
              </>
            )}
          </div>
        </div>
  
        {/* Log Messages */}
        {log && <div style={specStyles.log}>{log}</div>}
      </div>
    );
  }
  

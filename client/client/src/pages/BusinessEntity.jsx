import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TableSelector from '../components/TableSelector';
const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '800px', margin: '2rem auto' },
  form: { border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' },
  label: { display: 'block', marginTop: '0.5rem' },
  input: { width: '100%', padding: '0.3rem' },
  button: { marginTop: '0.5rem', padding: '0.4rem 0.8rem' },
  pre: { background: '#f7f7f7', padding: '1rem', borderRadius: '4px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' },
  td: { border: '1px solid #ccc', padding: '0.5rem' },
  ul: { listStyleType: 'none', padding: 0, marginTop: '1rem' },
  select: { width: '100%', padding: '0.3rem', marginTop: '0.5rem' },
  li: { padding: '0.3rem 0' },
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

const DynamicTableManager = () => {
  const [log, setLog] = useState('');
  const [createTable, setCreateTable] = useState({ tableName: '', columns: '' });
  const [addColumn, setAddColumn] = useState({ tableName: '', columnName: '', columnType: '' });
  const [renameColumn, setRenameColumn] = useState({ tableName: '', columnName: '', newColumnName: '' });
  const [deleteColumn, setDeleteColumn] = useState({ tableName: '', columnName: '' });
  const [showTableName, setShowTableName] = useState('');
  const [tableData, setTableData] = useState([]);
  const [tableNames, setTableNames] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState([]);
  const [jsonInput, setJsonInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();

  

  
  // Fetch table names on mount
  useEffect(() => {
    fetch('/api/tables')
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(names => {
        setTableNames(names);
        if (names.length > 0) setSelectedTable(names[0]);
        setLog(`Loaded ${names.length} tables.`);
      })
      .catch(err => {
        setLog(`Fetch error: ${err.message}`);
      });
  }, []);
  // load rows when table changes
  useEffect(() => {
    if (!selectedTable) return;
    fetchRows();
  }, [selectedTable]);

  // Fetch all tables on mount
  // This is to populate the dropdown for selecting a table
  // and to allow the user to manage columns and rows.
  useEffect(() => {
    fetch('/api/tables')
      .then(r => r.json())
      .then(setTables)
      .catch(console.error);
  }, []);

  const fetchRows = () => {
    fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => setRows(data))
      .catch(err => setLog(`Row fetch error: ${err.message}`));
  };
  

  const sendRequest = async (url, options = {}, onSuccess) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('Content-Type') || '';
      const text = await res.text();

      if (options.method === 'GET' && onSuccess) {
        try {
          const data = JSON.parse(text);
          onSuccess(data);
          return;
        } catch (err) {
          setLog(text);
          return;
        }
      }

      if (contentType.includes('application/json')) {
        try {
          const json = JSON.parse(text);
          setLog(JSON.stringify(json, null, 2));
          return;
        } catch {}
      }

      setLog(text);
    } catch (err) {
      setLog('Fetch error: ' + err.message);
    }
  };

  const handleAction = (e, action) => {
    e.preventDefault();
    let url = '';
    let options = {};

    switch (action) {
      case 'create':
        url = '/api/tables';
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableName: createTable.tableName, columns: JSON.parse(createTable.columns || '{}') })
        };
        break;
      case 'add':
        url = `/api/tables/${encodeURIComponent(addColumn.tableName)}/columns`;
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnName: addColumn.columnName, columnType: addColumn.columnType })
        };
        break;
      case 'rename':
        url = `/api/tables/${encodeURIComponent(renameColumn.tableName)}/columns/rename`;
        options = {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnName: renameColumn.columnName, newColumnName: renameColumn.newColumnName })
        };
        break;
      case 'delete':
        url = `/api/tables/${encodeURIComponent(deleteColumn.tableName)}/columns/${encodeURIComponent(deleteColumn.columnName)}`;
        options = { method: 'DELETE' };
        break;
      default:
        return;
    }

    sendRequest(url, options);
  };

  const handleShow = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTableData(data);
      setLog(`Fetched ${data.length} rows from "${selectedTable}".`);
    } catch (err) {
      setTableData([]);
      setLog(`Fetch error: ${err.message}`);
    }
  };
  

  const handleList = async () => {
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const names = await res.json();
      setTableNames(names);
      setLog(`Found ${names.length} tables.`);
    } catch (err) {
      setTableNames([]);
      setLog(`Fetch error: ${err.message}`);
    }
  };
//   add data to a table row
const handleAdd = () => {
    try {
      const body = JSON.parse(jsonInput);
      fetch(`/api/tables/${encodeURIComponent(selectedTable)}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.text();
        })
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
  // edit a table row
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
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.text();
        })
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
  // delete a table row
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
      <h1>Table & Column Manager</h1>

      {/* List Tables */}
      <button style={styles.button} onClick={handleList}>List All Tables</button>
      {tableNames.length > 0 && (
        <ul style={styles.ul}>
          {tableNames.map(name => <li key={name} style={styles.li}>{name}</li>)}
        </ul>
      )}

      {/* Create Table */}
      <form style={styles.form} onSubmit={e => handleAction(e, 'create')}>
        <h2>Create Table</h2>
        <label style={styles.label}>Table Name<input style={styles.input} value={createTable.tableName} onChange={e => setCreateTable({ ...createTable, tableName: e.target.value })} required /></label>
        <label style={styles.label}>Columns JSON<input style={styles.input} placeholder='{"id":"SERIAL PRIMARY KEY","name":"VARCHAR(100)"}' value={createTable.columns} onChange={e => setCreateTable({ ...createTable, columns: e.target.value })} /></label>
        <button style={styles.button} type="submit">Create Table</button>
      </form>

      {/* Add Column */}
      <form style={styles.form} onSubmit={e => handleAction(e, 'add')}>
        <h2>Add Column</h2>
        <label style={styles.label}>Table Name<input style={styles.input} value={addColumn.tableName} onChange={e => setAddColumn({ ...addColumn, tableName: e.target.value })} required /></label>
        <label style={styles.label}>Column Name<input style={styles.input} value={addColumn.columnName} onChange={e => setAddColumn({ ...addColumn, columnName: e.target.value })} required /></label>
        <label style={styles.label}>Column Type<input style={styles.input} value={addColumn.columnType} onChange={e => setAddColumn({ ...addColumn, columnType: e.target.value })} placeholder="INT, VARCHAR(50), etc." required /></label>
        <button style={styles.button} type="submit">Add Column</button>
      </form>

      {/* Rename Column */}
      <form style={styles.form} onSubmit={e => handleAction(e, 'rename')}>
        <h2>Rename Column</h2>
        <label style={styles.label}>Table Name<input style={styles.input} value={renameColumn.tableName} onChange={e => setRenameColumn({ ...renameColumn, tableName: e.target.value })} required /></label>
        <label style={styles.label}>Old Column Name<input style={styles.input} value={renameColumn.columnName} onChange={e => setRenameColumn({ ...renameColumn, columnName: e.target.value })} required /></label>
        <label style={styles.label}>New Column Name<input style={styles.input} value={renameColumn.newColumnName} onChange={e => setRenameColumn({ ...renameColumn, newColumnName: e.target.value })} required /></label>
        <button style={styles.button} type="submit">Rename Column</button>
      </form>

      {/* Delete Column */}
      <form style={styles.form} onSubmit={e => handleAction(e, 'delete')}>
        <h2>Delete Column</h2>
        <label style={styles.label}>Table Name<input style={styles.input} value={deleteColumn.tableName} onChange={e => setDeleteColumn({ ...deleteColumn, tableName: e.target.value })} required /></label>
        <label style={styles.label}>Column Name<input style={styles.input} value={deleteColumn.columnName} onChange={e => setDeleteColumn({ ...deleteColumn, columnName: e.target.value })} required /></label>
        <button style={styles.button} type="submit">Delete Column</button>
      </form>

      {/* Show Table */}
      <form style={styles.form} onSubmit={handleShow}>
        <h2>Show Table</h2>
        <label style={styles.label}>Select Table</label>
        <select
          style={styles.select}
          value={selectedTable}
          onChange={e => setSelectedTable(e.target.value)}
          required
        >
          {tableNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button style={styles.button} type="submit">Show Rows</button>
      </form>

      {tableData.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              {Object.keys(tableData[0]).map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i}>
                {Object.entries(row).map(([k, v]) => (
                  <td key={k} style={styles.td}>{String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
         
         
        
      )}

      {/* Table Data */}
      {tableData.length > 0 && (
        <table style={styles.table}>
          <thead><tr>{Object.keys(tableData[0]).map(col => <th key={col} style={styles.th}>{col}</th>)}</tr></thead>
          <tbody>{tableData.map((row, i) => <tr key={i}>{Object.entries(row).map(([k, v]) => <td key={k} style={styles.td}>{String(v)}</td>)}</tr>)}</tbody>
        </table>
      )}

      {/* Log */}
      <h2>Server Response</h2>
      <pre style={styles.pre}>{log}</pre>
    
     {/* 
      TableSelector is a child component that renders
      the <select> dropdown. It receives:
      - `tables`: an array of table-name strings
      - `onSelect`: callback invoked with the chosen name
    */}
    <TableSelector
        tables={tables}
        onSelect={name => {
          console.log('navigating to', name);
          navigate(`/tables/${encodeURIComponent(name)}`);
        }}
      />
    
  
</div>
    
    
    
  );
};

export default DynamicTableManager;

export const api = axios.create({ baseURL: '/api' });

export function addRow(tableName, rowData) {
  return api.post(`/tables/${tableName}/rows`, rowData);
}

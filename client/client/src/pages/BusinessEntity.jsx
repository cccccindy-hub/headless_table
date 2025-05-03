import React, { useState, useEffect } from 'react';

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
  li: { padding: '0.3rem 0' }
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
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(showTableName)}/rows`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTableData(data);
      setLog(`Fetched ${data.length} rows from "${showTableName}".`);
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
        <label style={styles.label}>Table Name<input style={styles.input} value={showTableName} onChange={e => setShowTableName(e.target.value)} required /></label>
        <button style={styles.button} type="submit">Show Table</button>
      </form>

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
    </div>
  );
};

export default DynamicTableManager;

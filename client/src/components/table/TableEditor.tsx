import React, { useState } from 'react';
import { Table } from '../../types/types';
import theme from '../../styles/theme';
import TableList from './TableList';
import Spreadsheet from './Spreadsheet';

const TableEditor: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [version, setVersion] = useState<string>('1.0');
  const [sqlScript, setSqlScript] = useState<string>('');

  const selectedTable = tables.find((t) => t.name === selectedTableName) || null;

  const addTable = (): void => {
    const name = window.prompt('Enter table name');
    if (!name || tables.some((t) => t.name === name)) {
      alert('Please enter a unique table name');
      return;
    }
    const newTable: Table = {
      name,
      columns: ['Column1', 'Version'],
      rows: [],
    };
    setTables([...tables, newTable]);
    setSelectedTableName(name);
  };

  const deleteTable = (name: string): void => {
    if (window.confirm(`Are you sure you want to delete the table "${name}"?`)) {
      setTables(tables.filter((t) => t.name !== name));
      if (selectedTableName === name) {
        setSelectedTableName(null);
      }
    }
  };

  const editCell = (rowIndex: number, column: string, value: string): void => {
    setTables(tables.map((t) =>
      t.name === selectedTableName
        ? {
            ...t,
            rows: t.rows.map((row, i) =>
              i === rowIndex ? { ...row, [column]: value } : row
            ),
          }
        : t
    ));
  };

  const editHeader = (columnIndex: number, newName: string): void => {
    if (!selectedTable) return;
    if (selectedTable.columns[columnIndex] === 'Version') return;
    
    setTables(tables.map((t) =>
      t.name === selectedTableName
        ? {
            ...t,
            columns: t.columns.map((col, i) => (i === columnIndex ? newName : col)),
            rows: t.rows.map((row) => {
              const oldName = t.columns[columnIndex];
              const { [oldName]: value, ...rest } = row;
              return { ...rest, [newName]: value };
            }),
          }
        : t
    ));
  };

  const addRow = (): void => {
    if (!selectedTable) return;
    
    setTables(tables.map((t) =>
      t.name === selectedTableName
        ? {
            ...t,
            rows: [
              ...t.rows,
              Object.fromEntries(t.columns.map((col) => [col, col === 'Version' ? version : ''])),
            ],
          }
        : t
    ));
  };

  const addColumn = (): void => {
    if (!selectedTable) return;
    
    setTables(tables.map((t) =>
      t.name === selectedTableName
        ? {
            ...t,
            columns: [...t.columns, `Column${t.columns.length}`],
            rows: t.rows.map((row) => ({ ...row, [`Column${t.columns.length}`]: '' })),
          }
        : t
    ));
  };

  const deleteRow = (rowIndex: number): void => {
    setTables(tables.map((t) =>
      t.name === selectedTableName
        ? { ...t, rows: t.rows.filter((_, i) => i !== rowIndex) }
        : t
    ));
  };

  const deleteColumn = (columnIndex: number): void => {
    if (!selectedTable) return;
    if (selectedTable.columns[columnIndex] === 'Version') {
      alert('Cannot delete the Version column');
      return;
    }
    
    setTables(tables.map((t) =>
      t.name === selectedTableName
        ? {
            ...t,
            columns: t.columns.filter((_, i) => i !== columnIndex),
            rows: t.rows.map((row) => {
              const columnName = t.columns[columnIndex];
              const { [columnName]: _, ...rest } = row;
              return rest;
            }),
          }
        : t
    ));
  };

  const generateSQL = (): void => {
    if (!selectedTable) {
      setSqlScript('No table selected');
      return;
    }
    const { name, columns, rows } = selectedTable;
    if (rows.length === 0) {
      setSqlScript('No rows to generate SQL for');
      return;
    }
    const sql = rows.map((row) => {
      const cols = columns.join(', ');
      const values = columns.map((col) => `'${row[col] || ''}'`).join(', ');
      return `INSERT INTO ${name} (${cols}) VALUES (${values});`;
    }).join('\n');
    setSqlScript(sql);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result as string;
      const lines = text.split('\n').map((line) => line.trim()).filter((line) => line);
      if (lines.length === 0) {
        alert('Empty CSV file');
        return;
      }

      const headers = lines[0].split(',').map((header) => header.trim());
      if (!headers.includes('Version')) {
        headers.push('Version'); // Ensure Version column exists
      }

      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((value) => value.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = index < values.length ? values[index] : (header === 'Version' ? version : '');
        });
        return row;
      });

      if (selectedTable) {
        // Overwrite the selected table's contents
        setTables(tables.map((t) =>
          t.name === selectedTableName
            ? {
                ...t,
                columns: headers,
                rows,
              }
            : t
        ));
      } else {
        // Create new table if none selected
        const tableName = file.name.replace('.csv', '') || 'ImportedTable';
        if (tables.some((t) => t.name === tableName)) {
          alert('Table name already exists; please select a table to overwrite or rename your file');
          return;
        }
        const newTable: Table = {
          name: tableName,
          columns: headers,
          rows,
        };
        setTables([...tables, newTable]);
        setSelectedTableName(tableName);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input for re-import
  };

  const exportCSV = (): void => {
    if (!selectedTable) {
      alert('No table selected');
      return;
    }
    
    const { name, columns, rows } = selectedTable;
    const headerRow = columns.join(',');
    const dataRows = rows.map(row => columns.map(col => row[col] || '').join(','));
    const csvContent = [headerRow, ...dataRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadows.sm
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.lg
        }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.sm
          }}>
            <span>Version:</span>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Set version"
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.border}`,
                width: "80px"
              }}
            />
          </label>
          
          <button 
            onClick={generateSQL}
            style={{
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.radius.sm,
              cursor: "pointer",
              fontWeight: theme.fontWeights.medium
            }}
          >
            Generate SQL
          </button>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.lg
        }}>
          <label style={{
            backgroundColor: theme.colors.accent,
            color: "white",
            border: "none",
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            borderRadius: theme.radius.sm,
            cursor: "pointer",
            fontWeight: theme.fontWeights.medium,
            display: "inline-block"
          }}>
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
          
          <button 
            onClick={exportCSV}
            disabled={!selectedTable}
            style={{
              backgroundColor: selectedTable ? theme.colors.secondary : theme.colors.lightGrey,
              color: "white",
              border: "none",
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.radius.sm,
              cursor: selectedTable ? "pointer" : "not-allowed",
              opacity: selectedTable ? 1 : 0.6,
              fontWeight: theme.fontWeights.medium
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: theme.spacing.xl }}>
        <TableList
          tables={tables}
          selectedTable={selectedTableName}
          onSelect={(table) => setSelectedTableName(table.name)}
          onAdd={addTable}
          onDelete={deleteTable}
        />

        <div>
          {selectedTable ? (
            <>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: theme.spacing.lg
              }}>
                <h2 style={{ margin: 0, color: theme.colors.primary }}>{selectedTable.name}</h2>
                <div>
                  <button 
                    onClick={addRow}
                    style={{
                      backgroundColor: theme.colors.secondary,
                      color: "white",
                      border: "none",
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      borderRadius: theme.radius.sm,
                      cursor: "pointer",
                      marginRight: theme.spacing.md
                    }}
                  >
                    Add Row
                  </button>
                  <button 
                    onClick={addColumn}
                    style={{
                      backgroundColor: theme.colors.accent,
                      color: "white",
                      border: "none",
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      borderRadius: theme.radius.sm,
                      cursor: "pointer"
                    }}
                  >
                    Add Column
                  </button>
                </div>
              </div>
              <Spreadsheet
                table={selectedTable}
                onEditCell={editCell}
                onEditHeader={editHeader}
                onDeleteRow={deleteRow}
                onDeleteColumn={deleteColumn}
              />
            </>
          ) : (
            <div style={{
              backgroundColor: theme.colors.card,
              padding: theme.spacing.xl,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              textAlign: "center",
              color: theme.colors.darkGrey
            }}>
              <p>Select a table to edit or create a new one</p>
            </div>
          )}

          {sqlScript && (
            <div style={{
              backgroundColor: theme.colors.card,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              marginTop: theme.spacing.xl
            }}>
              <h3 style={{ 
                margin: "0 0 10px 0",
                color: theme.colors.primary
              }}>Generated SQL</h3>
              <pre style={{
                background: theme.colors.lightGrey,
                padding: theme.spacing.md,
                borderRadius: theme.radius.sm,
                overflowX: "auto",
                fontSize: theme.fontSizes.sm
              }}>
                {sqlScript}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableEditor;

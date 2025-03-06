import React from 'react';
import { Table } from '../../types/types';
import theme from '../../styles/theme';

interface SpreadsheetProps {
  table: Table;
  onEditCell: (rowIndex: number, column: string, value: string) => void;
  onEditHeader: (columnIndex: number, newName: string) => void;
  onDeleteRow: (rowIndex: number) => void;
  onDeleteColumn: (columnIndex: number) => void;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({
  table,
  onEditCell,
  onEditHeader,
  onDeleteRow,
  onDeleteColumn
}: any) => {
  const { columns, rows } = table;

  return (
    <div style={{
      maxWidth: "100%",
      overflowX: "auto",
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.md,
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: theme.fontSizes.md,
      }}>
        <thead>
          <tr>
            <th style={{ padding: theme.spacing.sm, minWidth: "40px" }}></th>
            {columns.map((col: any, index: number) => (
              <th key={index} style={{ padding: theme.spacing.xs }}>
                <button 
                  onClick={() => onDeleteColumn(index)}
                  disabled={col === 'Version'}
                  style={{
                    backgroundColor: col === 'Version' ? theme.colors.lightGrey : theme.colors.warning,
                    color: "white",
                    border: "none",
                    borderRadius: theme.radius.sm,
                    padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
                    fontSize: theme.fontSizes.sm,
                    cursor: col === 'Version' ? "not-allowed" : "pointer",
                    opacity: col === 'Version' ? 0.5 : 1,
                  }}
                >
                  Del
                </button>
              </th>
            ))}
          </tr>
          <tr>
            <th style={{ padding: theme.spacing.sm }}></th>
            {columns.map((col:any, index:any) => (
              <th key={index} style={{ padding: theme.spacing.sm }}>
                <input
                  type="text"
                  value={col}
                  onChange={(e:any) => onEditHeader(index, e.target.value)}
                  disabled={col === 'Version'}
                  style={{
                    width: "100%",
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: theme.fontSizes.md,
                    backgroundColor: col === 'Version' ? theme.colors.lightGrey : "white",
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, rowIndex: number) => (
            <tr 
              key={rowIndex}
              style={{
                backgroundColor: rowIndex % 2 === 0 ? theme.colors.lightGrey : "white",
              }}
            >
              <td style={{ 
                padding: theme.spacing.sm,
                textAlign: "center" 
              }}>
                <button 
                  onClick={() => onDeleteRow(rowIndex)}
                  style={{
                    backgroundColor: theme.colors.warning,
                    color: "white",
                    border: "none",
                    borderRadius: theme.radius.sm,
                    padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
                    fontSize: theme.fontSizes.sm,
                    cursor: "pointer",
                  }}
                >
                  Del
                </button>
              </td>
              {columns.map((col:any, colIndex:any) => (
                <td key={colIndex} style={{ padding: theme.spacing.xs }}>
                  {col === 'Version' ? (
                    <span style={{ 
                      padding: theme.spacing.xs,
                      display: "block",
                      textAlign: "center",
                      fontWeight: theme.fontWeights.medium,
                      color: theme.colors.primary
                    }}>
                      {row[col]}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={row[col] || ''}
                      onChange={(e:any) => onEditCell(rowIndex, col, e.target.value)}
                      style={{
                        width: "100%",
                        padding: theme.spacing.xs,
                        borderRadius: theme.radius.sm,
                        border: `1px solid ${theme.colors.lightBorder}`,
                      }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Spreadsheet;

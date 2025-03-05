import React from 'react';
import { Table } from '../../types/types';
import theme from '../../styles/theme';

interface TableListProps {
  tables: Table[];
  selectedTable: string | null;
  onSelect: (table: Table) => void;
  onAdd: () => void;
  onDelete: (name: string) => void;
}

const TableList: React.FC<TableListProps> = ({ 
  tables, 
  selectedTable, 
  onSelect, 
  onAdd, 
  onDelete 
}) => {
  return (
    <div style={{
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      marginBottom: theme.spacing.xl
    }}>
      <h2 style={{
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semiBold,
        marginBottom: theme.spacing.md
      }}>Tables</h2>
      
      <button 
        onClick={onAdd}
        style={{
          backgroundColor: theme.colors.secondary,
          color: "white",
          border: "none",
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          borderRadius: theme.radius.sm,
          cursor: "pointer",
          marginBottom: theme.spacing.lg,
          fontWeight: theme.fontWeights.medium
        }}
      >
        + Add Table
      </button>
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing.xs
      }}>
        {tables.map((table) => (
          <div 
            key={table.name} 
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              backgroundColor: selectedTable === table.name ? `${theme.colors.primary}10` : theme.colors.lightGrey,
              border: selectedTable === table.name 
                ? `1px solid ${theme.colors.primary}` 
                : `1px solid ${theme.colors.lightBorder}`
            }}
          >
            <span 
              onClick={() => onSelect(table)}
              style={{ 
                cursor: "pointer", 
                fontWeight: selectedTable === table.name ? theme.fontWeights.medium : theme.fontWeights.regular,
                flex: 1 
              }}
            >
              {table.name}
            </span>
            <button
              onClick={() => onDelete(table.name)}
              style={{
                backgroundColor: theme.colors.warning,
                color: "white",
                border: "none",
                borderRadius: theme.radius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                fontSize: theme.fontSizes.sm,
                cursor: "pointer"
              }}
            >
              Delete
            </button>
          </div>
        ))}
        
        {tables.length === 0 && (
          <div style={{
            padding: theme.spacing.md,
            textAlign: "center",
            color: theme.colors.darkGrey,
            fontStyle: "italic"
          }}>
            No tables yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default TableList;

import React, { useState } from "react";
import { calculateAll } from "./dynamicCalculator.ts";
import initialData from "./initialJson.json";
import { adaptInitialData } from "./utils/calculatorUtils";
import theme from "./styles/theme";
import TableEditor from "./components/table/TableEditor";

export interface Variable {
  name: string;
  value: number | string;
}

export interface Expression {
  operation?: string;
  operands?: Expression[];
  variable?: string;
  literal?: number | string;
  comparator?: string;
  calculationExpression?: Expression;
  type?: string; // Add type field to match JSON format
}

// Fix the interface mismatch with JSON structure
export interface CalculatorSchema {
  calculatorName: string; // Match JSON structure
  id: string;
  calculationConfigs: { // Match JSON structure
    calculationName: string;
    outputVariable: string;
    calculationExpression: Expression;
  }[];
}

export const initialVariables: Variable[] = [
  { name: "coverAmount", value: 20000 },
  { name: "accidentalFactor", value: 1.0 },
  { name: "pricingFactorsBase", value: 100.0 },
  { name: "pricingFactorsAids", value: 0.0 },
  { name: "pricingFactorsConstant", value: 0.0 },
  { name: "baseQxFactor", value: 0.027689965 },
  { name: "aidsQxFactor", value: 0 },
  { name: "underWritingExpense", value: 0.0 },
  { name: "durationFactor", value: 1.0 },
  { name: "initialExpense", value: 0.0 },
  { name: "recurringExpense", value: 0.0 },
  { name: "topUpExpenseFactor", value: 20.0 },
  { name: "expenseLoading", value: 0.0 },
  { name: "rewardExpenseValue", value: 0.0 },
  { name: "intermediaryDiscount", value: 0.0 },
  { name: "asAndWhenCommission", value: 0.0 },
  { name: "difLoading", value: 0.0 },
  { name: "distributionRate", value: 0.0 },
  { name: "initialTargetValue", value: 15.0 },
  { name: "factor1Impact", value: 1 },
  { name: "ageTopUpFactor", value: 1.45 },
  { name: "relationshipTopUpFactor", value: 1.38 },
  { name: "fixedCalculatedNonePrice", value: 0 },
  { name: "policyType", value: "standard" }
];

export const operationTypes: string[] = ["add", "subtract", "multiply", "divide", "if", "max", "set"];

function toSchemaJson(data: CalculatorSchema): any {
  const transformExpression = (expr: Expression): any => {
    if (expr.calculationExpression) {
      return {
        calculationExpression: transformExpression(expr.calculationExpression)
      };
    } else if (expr.literal !== undefined) {
      return { type: "literal", literal: expr.literal };
    } else if (expr.variable) {
      return { type: "variable", variable: expr.variable };
    } else if (expr.operation) {
      return {
        type: "operation",
        operation: expr.operation,
        operands: expr.operands?.map(transformExpression),
        comparator: expr.comparator
      };
    }
    throw new Error("Invalid expression");
  };

  return {
    calculatorName: data.calculatorName,
    id: data.id,
    calculationConfigs: data.calculationConfigs.map(calc => ({
      calculationName: calc.calculationName,
      outputVariable: calc.outputVariable,
      calculationExpression: transformExpression(calc.calculationExpression)
    }))
  };
}

// Color scheme constants
const colors = {
  primary: "#3498db",
  secondary: "#2ecc71",
  accent: "#9b59b6",
  warning: "#e74c3c",
  background: "#f8f9fa",
  card: "#ffffff",
  text: "#2c3e50",
  border: "#dee2e6",
  lightBorder: "#e9ecef",
  lightGrey: "#f1f3f5",
  darkGrey: "#6c757d"
};

// Header component
const Header: React.FC<{ title: string }> = ({ title }) => (
  <header style={{
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: "15px",
    marginBottom: "20px"
  }}>
    <h1 style={{ 
      color: colors.primary,
      fontSize: "28px",
      fontWeight: 600
    }}>{title}</h1>
    <p style={{ color: colors.darkGrey }}>
      Create and configure calculation expressions with immediate feedback
    </p>
  </header>
);

// TabContainer component for switching between views
interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabContainer: React.FC<TabProps & { children: React.ReactNode }> = ({ 
  activeTab, 
  onTabChange, 
  children 
}) => {
  return (
    <div>
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: "20px"
      }}>
        <TabButton 
          title="Calculator" 
          isActive={activeTab === "calculator"} 
          onClick={() => onTabChange("calculator")} 
        />
        <TabButton 
          title="JSON Output" 
          isActive={activeTab === "json"} 
          onClick={() => onTabChange("json")} 
        />
        <TabButton 
          title="Tables" 
          isActive={activeTab === "tables"} 
          onClick={() => onTabChange("tables")} 
        />
      </div>
      {children}
    </div>
  );
};

const TabButton: React.FC<{ 
  title: string; 
  isActive: boolean; 
  onClick: () => void 
}> = ({ title, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 20px",
      fontSize: "16px",
      fontWeight: isActive ? 600 : 400,
      backgroundColor: isActive ? colors.card : "transparent",
      color: isActive ? colors.primary : colors.darkGrey,
      border: "none",
      borderBottom: isActive ? `3px solid ${colors.primary}` : "3px solid transparent",
      cursor: "pointer",
      marginRight: "10px"
    }}
  >
    {title}
  </button>
);

// Calculation Toolbar component
interface ToolbarProps {
  onCalculate: () => void;
  onAddCalculation: () => void;
}

const CalculationToolbar: React.FC<ToolbarProps> = ({ onCalculate, onAddCalculation }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    backgroundColor: colors.card,
    padding: "15px",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  }}>
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "15px"
    }}>
      <button
        onClick={onCalculate}
        style={{
          backgroundColor: colors.primary,
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "16px"
        }}
      >
        Calculate Results
      </button>
      
      <button
        onClick={onAddCalculation}
        style={{
          backgroundColor: colors.secondary,
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span>+</span> Add Calculation
      </button>
    </div>
    
    <div style={{
      fontSize: "14px",
      color: colors.darkGrey
    }}>
      Configure your calculations and click Calculate to see results
    </div>
  </div>
);

// Variables Panel component
interface VariablesPanelProps {
  variables: Variable[];
  onAddVariable: () => void;
  onUpdateVariable: (index: number, key: string, value: any) => void;
}

const VariablesPanel: React.FC<VariablesPanelProps> = ({ 
  variables, 
  onAddVariable,
  onUpdateVariable 
}) => (
  <div style={{ 
    backgroundColor: colors.card,
    padding: "20px",
    borderRadius: "6px",
    border: `1px solid ${colors.border}`,
    marginBottom: "20px"
  }}>
    <h2 style={{ 
      fontSize: "18px", 
      fontWeight: 600, 
      margin: "0 0 15px 0"
    }}>Variables</h2>
    
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "10px", 
      marginBottom: "20px" 
    }}>
      {variables.map((v, index) => (
        <div key={index} style={{ 
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          padding: "8px",
          borderRadius: "4px",
          backgroundColor: index % 2 === 0 ? colors.lightGrey : "white",
          border: `1px solid ${colors.lightBorder}`
        }}>
          <input
            type="text"
            value={v.name}
            placeholder="Variable Name"
            onChange={(e) => onUpdateVariable(index, "name", e.target.value)}
            style={{
              padding: "6px 8px",
              borderRadius: "4px",
              border: `1px solid ${colors.border}`,
              fontSize: "14px",
              width: "100%"
            }}
          />
          {typeof v.value === "string" ? (
            <input
              type="text"
              value={v.value}
              placeholder="String Value"
              onChange={(e) => onUpdateVariable(index, "value", e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                fontSize: "14px",
                width: "100%"
              }}
            />
          ) : (
            <input
              type="number"
              value={v.value}
              placeholder="Number Value"
              onChange={(e) => onUpdateVariable(index, "value", Number(e.target.value))}
              style={{
                padding: "6px 8px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                fontSize: "14px",
                width: "100%"
              }}
            />
          )}
        </div>
      ))}
    </div>

    <button 
      onClick={onAddVariable}
      style={{
        backgroundColor: colors.accent,
        color: "white",
        border: "none",
        padding: "8px 12px",
        borderRadius: "4px",
        cursor: "pointer",
        width: "100%"
      }}
    >
      + Add Variable
    </button>
  </div>
);

// Calculation Step component
interface CalculationStepProps {
  calc: any;
  index: number;
  onUpdate: (index: number, newCalc: any) => void;
  onRemove: (index: number) => void;
  variables: Variable[];
}

const CalculationStep: React.FC<CalculationStepProps> = ({
  calc,
  index,
  onUpdate,
  onRemove,
  variables
}) => {
  return (
    <div style={{ 
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      padding: "16px",
      backgroundColor: colors.card,
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        marginBottom: "12px" 
      }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: "18px", color: colors.primary }}>
          {calc.calculationName || "Unnamed Calculation"}
        </h3>
        <button 
          onClick={() => onRemove(index)}
          style={{
            backgroundColor: colors.warning,
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Remove
        </button>
      </div>

      <div style={{ 
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginBottom: "15px" 
      }}>
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "5px",
            fontWeight: 500,
            fontSize: "14px",
            color: colors.darkGrey
          }}>
            Calculation Name:
          </label>
          <input
            type="text"
            value={calc.calculationName}
            onChange={(e) => {
              const updatedCalc = { ...calc, calculationName: e.target.value };
              onUpdate(index, updatedCalc);
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "4px",
              border: `1px solid ${colors.border}`,
              fontSize: "14px"
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "5px",
            fontWeight: 500,
            fontSize: "14px",
            color: colors.darkGrey
          }}>
            Output Variable:
          </label>
          <input
            type="text"
            value={calc.outputVariable}
            onChange={(e) => {
              const updatedCalc = { ...calc, outputVariable: e.target.value };
              onUpdate(index, updatedCalc);
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "4px",
              border: `1px solid ${colors.border}`,
              fontSize: "14px"
            }}
          />
        </div>
      </div>

      <div style={{ 
        backgroundColor: colors.lightGrey,
        padding: "15px",
        borderRadius: "4px",
        border: `1px solid ${colors.lightBorder}`
      }}>
        <div style={{ 
          marginBottom: "8px",
          fontWeight: 500,
          fontSize: "14px"
        }}>Expression Builder:</div>
        <NodeEditor
          node={calc.calculationExpression}
          onChange={(newCalculation) => {
            const updatedCalc = { ...calc, calculationExpression: newCalculation };
            onUpdate(index, updatedCalc);
          }}
          variables={variables}
        />
      </div>
    </div>
  );
};

// Results Display component
interface ResultsDisplayProps {
  results: any;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) return null;
  
  return (
    <div style={{ 
      backgroundColor: colors.card,
      padding: "15px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      marginTop: "15px",
      marginBottom: "20px",
      display: "flex",
      flexDirection: "row",
      gap: "15px"
    }}>
      <div style={{
        flex: "1",
        borderRight: `1px solid ${colors.lightBorder}`,
        paddingRight: "15px"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "5px", color: colors.primary }}>Final Result:</div>
        <div style={{ 
          fontSize: "24px", 
          fontWeight: 700, 
          color: colors.primary 
        }}>{results.total}</div>
      </div>
      
      <div style={{ flex: "2" }}>
        <div style={{ fontWeight: 600, marginBottom: "8px", color: colors.darkGrey }}>Calculation Steps:</div>
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "4px",
          maxHeight: "120px",
          overflowY: "auto"
        }}>
          {results.details.map((detail: any, idx: number) => (
            <div key={idx} style={{ 
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: idx % 2 === 0 ? colors.lightGrey : "white",
              border: `1px solid ${colors.lightBorder}`,
              fontSize: "14px"
            }}>
              <span style={{ fontWeight: 500 }}>{detail.name}:</span>
              <span>{detail.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// JSON Viewer component
interface JSONViewerProps {
  data: any;
}

const JSONViewer: React.FC<JSONViewerProps> = ({ data }) => {
  const jsonOutput = toSchemaJson(data);
  
  return (
    <div style={{
      padding: "20px",
      backgroundColor: colors.card,
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
    }}>
      <h2 style={{ 
        fontSize: "20px", 
        fontWeight: 600, 
        margin: "0 0 15px 0" 
      }}>Generated JSON</h2>
      
      <pre style={{ 
        background: colors.lightGrey,
        padding: "15px",
        borderRadius: "4px",
        overflowX: "auto",
        fontSize: "13px",
        border: `1px solid ${colors.lightBorder}`,
        maxHeight: "600px",
        overflowY: "auto"
      }}>
        {JSON.stringify(jsonOutput, null, 2)}
      </pre>
    </div>
  );
};

// Main App component
export function App(): JSX.Element {
  const [data, setData] = useState<CalculatorSchema>(adaptInitialData());
  const [variables, setVariables] = useState<Variable[]>(initialVariables);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("calculator");

  const addCalculation = (): void => {
    const newCalc = {
      calculationName: "New Calculation",
      outputVariable: "newOutput",
      calculationExpression: { type: "literal", literal: 0 }
    };
    setData({
      ...data,
      calculationConfigs: [...data.calculationConfigs, newCalc]
    });
  };

  const removeCalculation = (index: number): void => {
    const newCalcs = data.calculationConfigs.filter((_, i: number) => i !== index);
    setData({ ...data, calculationConfigs: newCalcs });
  };

  const updateCalculation = (index: number, updatedCalc: any): void => {
    const newCalcs = [...data.calculationConfigs];
    newCalcs[index] = updatedCalc;
    setData({ ...data, calculationConfigs: newCalcs });
  };

  const addVariable = (): void => setVariables([...variables, { name: "", value: 0 }]);
  const updateVariable = (index: number, key: string, value: any): void =>
    setVariables(variables.map((v, i) => (i === index ? { ...v, [key]: value } : v)));

  const calculateResult = (): void => {
    try {
      const res = calculateAll(data.calculationConfigs, variables);
      const newVarsMap: Record<string, any> = {};
      variables.forEach((v) => {
        newVarsMap[v.name] = v.value;
      });
      data.calculationConfigs.forEach((calc, idx) => {
        newVarsMap[calc.outputVariable] = res.details[idx]?.total;
      });
      const newVarList = Object.entries(newVarsMap).map(([name, value]) => ({ name, value }));
      setVariables(newVarList);
      setResults(res);
      setActiveTab("calculator"); // Switch to calculator tab to display results
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div style={{
      padding: "20px",
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      backgroundColor: colors.background,
      color: colors.text,
      minHeight: "100vh"
    }}>
      <Header title="Dynamic Calculator Builder" />
      
      <TabContainer activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "calculator" ? (
          <div>
            <CalculationToolbar 
              onCalculate={calculateResult} 
              onAddCalculation={addCalculation} 
            />
            
            {/* Results Display moved to top */}
            <ResultsDisplay results={results} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "30px" }}>
              <div>
                <div style={{ 
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px" 
                }}>
                  {data.calculationConfigs.map((calc, index) => (
                    <CalculationStep
                      key={index}
                      calc={calc}
                      index={index}
                      onUpdate={updateCalculation}
                      onRemove={removeCalculation}
                      variables={variables}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <VariablesPanel 
                  variables={variables}
                  onAddVariable={addVariable}
                  onUpdateVariable={updateVariable}
                />
              </div>
            </div>
          </div>
        ) : activeTab === "tables" ? (
          <TableEditor />
        ) : (
          <JSONViewer data={data} />
        )}
      </TabContainer>
    </div>
  );
}

// NodeEditor component with improved styling
export function NodeEditor({ node, onChange, variables }: NodeEditorProps): JSX.Element {
  // Check for calculationExpression first
  if (node.calculationExpression) {
    return (
      <div style={{ 
        border: `1px solid ${colors.primary}`,
        borderRadius: "4px",
        padding: "15px", 
        margin: "10px 0",
        backgroundColor: `${colors.primary}10` // Using 10% opacity for background
      }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: "10px",
          color: colors.primary
        }}>Nested Calculation:</div>
        <NodeEditor 
          node={node.calculationExpression} 
          onChange={(updatedExpr) => onChange({ ...node, calculationExpression: updatedExpr })} 
          variables={variables} 
        />
      </div>
    );
  }

  // Determine current type based on properties.
  const currentType =
    node.literal !== undefined ? "literal" : node.variable ? "variable" : node.operation ? "operation" : "literal";

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    if (newType === currentType) return;
    if (newType === "literal") onChange({ literal: 0 });
    else if (newType === "variable") onChange({ variable: variables[0]?.name || "" });
    else if (newType === "operation") onChange({ operation: operationTypes[0] || "", operands: [] });
    else if (newType === "nested") onChange({ calculationExpression: { literal: 0 } });
  };

  // Define style based on currentType
  let typeStyles = {
    backgroundColor: colors.lightGrey,
    border: `1px solid ${colors.border}`,
    padding: "12px",
    borderRadius: "4px",
    margin: "5px 0"
  };

  // Adjust the type-specific style
  switch(currentType) {
    case "literal":
      typeStyles.backgroundColor = `${colors.secondary}10`;
      typeStyles.border = `1px solid ${colors.secondary}`;
      break;
    case "variable":
      typeStyles.backgroundColor = `${colors.accent}10`;
      typeStyles.border = `1px solid ${colors.accent}`;
      break;
    case "operation":
      typeStyles.backgroundColor = `${colors.primary}10`;
      typeStyles.border = `1px solid ${colors.primary}`;
      break;
  }

  return (
    <div style={typeStyles}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "10px",
        marginBottom: "8px"
      }}>
        <label style={{ 
          fontWeight: 500, 
          minWidth: "40px" 
        }}>Type:</label>
        <select 
          value={currentType} 
          onChange={handleTypeChange}
          style={{
            padding: "6px 10px",
            borderRadius: "4px",
            border: `1px solid ${colors.border}`,
            backgroundColor: "white",
            flex: 1
          }}
        >
          <option value="literal">Literal</option>
          <option value="variable">Variable</option>
          <option value="operation">Operation</option>
          <option value="nested">Nested Calculation</option>
        </select>
      </div>
      <div style={{ marginTop: "5px" }}>
        {currentType === "literal" ? (
          typeof node.literal === "string" ? (
            <input
              type="text"
              value={node.literal}
              onChange={(e) => onChange({ ...node, literal: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                backgroundColor: "white"
              }}
            />
          ) : (
            <input
              type="number"
              value={node.literal}
              onChange={(e) => onChange({ ...node, literal: Number(e.target.value) })}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                backgroundColor: "white"
              }}
            />
          )
        ) : currentType === "variable" ? (
          <select
            value={node.variable}
            onChange={(e) => onChange({ ...node, variable: e.target.value })}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "4px",
              border: `1px solid ${colors.border}`,
              backgroundColor: "white"
            }}
          >
            {variables.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        ) : (
          <OperationNode node={node} onChange={onChange} variables={variables} />
        )}
      </div>
    </div>
  );
}

// OperationNode component with improved styling
export function OperationNode({ node, onChange, variables }: OperationNodeProps): JSX.Element {
  const handleOperationChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange({ ...node, operation: e.target.value });
  };

  const handleOperandChange = (index: number, updatedOperand: Expression): void => {
    const newOperands = [...(node.operands || [])];
    newOperands[index] = updatedOperand;
    onChange({ ...node, operands: newOperands });
  };

  const removeOperand = (index: number): void => {
    onChange({ ...node, operands: (node.operands || []).filter((_, i) => i !== index) });
  };

  const addOperand = (type: string): void => {
    let newOperand: Expression;
    
    if (type === "literal") {
      newOperand = { literal: 0 };
    } else if (type === "variable") {
      newOperand = { variable: variables[0]?.name || "" };
    } else if (type === "nested") {
      newOperand = { calculationExpression: { literal: 0 } };
    } else {
      newOperand = { operation: type, operands: [] };
    }
    
    onChange({ ...node, operands: [...(node.operands || []), newOperand] });
  };

  const [selectedOperandType, setSelectedOperandType] = useState("");

  return (
    <div style={{ 
      padding: "12px", 
      borderRadius: "4px",
      backgroundColor: `${colors.primary}05` // 5% opacity
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "10px",
        marginBottom: "12px"
      }}>
        <label style={{ fontWeight: 500, minWidth: "80px" }}>
          Operation:
        </label>
        <select 
          value={node.operation} 
          onChange={handleOperationChange}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: "4px",
            border: `1px solid ${colors.border}`,
            backgroundColor: "white"
          }}
        >
          {operationTypes.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      {node.operation === "if" ? (
        <div style={{ marginTop: "10px" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            marginBottom: "15px"
          }}>
            <label style={{ fontWeight: 500, minWidth: "80px" }}>
              Comparator:
            </label>
            <select
              value={node.comparator || ""}
              onChange={(e) => onChange({ ...node, comparator: e.target.value })}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                backgroundColor: "white"
              }}
            >
              <option value="">Select Comparator</option>
              <option value=">">&gt;</option>
              <option value=">=">&gt;=</option>
              <option value="==">==</option>
              <option value="!=">!=</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
              <option value="isStringValue">isStringValue</option>
            </select>
          </div>
          
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "12px",
            backgroundColor: colors.lightGrey,
            padding: "15px",
            borderRadius: "4px"
          }}>
            <div>
              <label style={{ 
                display: "block",
                fontWeight: 500,
                marginBottom: "8px",
                color: colors.primary
              }}>If (Condition):</label>
              <NodeEditor
                node={node.operands && node.operands[0] ? node.operands[0] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(0, operand)}
                variables={variables}
              />
            </div>
            <div>
              <label style={{ 
                display: "block",
                fontWeight: 500,
                marginBottom: "8px",
                color: colors.primary
              }}>Compare With:</label>
              <NodeEditor
                node={node.operands && node.operands[1] ? node.operands[1] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(1, operand)}
                variables={variables}
              />
            </div>
            <div>
              <label style={{ 
                display: "block",
                fontWeight: 500,
                marginBottom: "8px",
                color: colors.secondary
              }}>Then (True):</label>
              <NodeEditor
                node={node.operands && node.operands[2] ? node.operands[2] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(2, operand)}
                variables={variables}
              />
            </div>
            <div>
              <label style={{ 
                display: "block",
                fontWeight: 500,
                marginBottom: "8px",
                color: colors.warning
              }}>Else (False):</label>
              <NodeEditor
                node={node.operands && node.operands[3] ? node.operands[3] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(3, operand)}
                variables={variables}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ 
            fontWeight: 500, 
            marginBottom: "10px",
            borderBottom: `1px solid ${colors.lightBorder}`,
            paddingBottom: "8px" 
          }}>Operands:</div>
          
          {node.operands?.map((operand, index) => (
            <div key={index} style={{ marginBottom: "15px" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px"
              }}>
                <span style={{ 
                  fontWeight: 500, 
                  fontSize: "14px",
                  color: colors.darkGrey 
                }}>Operand {index + 1}</span>
                <button 
                  onClick={() => removeOperand(index)}
                  style={{
                    backgroundColor: colors.warning,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              </div>
              
              <NodeEditor
                node={operand}
                onChange={(updatedOperand: Expression) => handleOperandChange(index, updatedOperand)}
                variables={variables}
              />
            </div>
          ))}
          
          <div style={{ 
            backgroundColor: colors.lightGrey,
            padding: "12px",
            borderRadius: "4px",
            marginTop: "10px",
            display: "flex",
            gap: "10px"
          }}>
            <select
              value={selectedOperandType}
              onChange={(e) => setSelectedOperandType(e.target.value)}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                backgroundColor: "white"
              }}
            >
              <option value="">Add Operand...</option>
              <option value="literal">Literal</option>
              <option value="variable">Variable</option>
              <option value="nested">Nested Calculation</option>
              {operationTypes.filter((op) => op !== "set").map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedOperandType) {
                  addOperand(selectedOperandType);
                  setSelectedOperandType("");
                }
              }}
              style={{
                backgroundColor: colors.accent,
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: 500
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NodeEditorProps {
  node: Expression;
  onChange: (node: Expression) => void;
  variables: Variable[];
}

interface OperationNodeProps extends NodeEditorProps {}

interface NodeEditorProps {
  node: Expression;
  onChange: (node: Expression) => void;
  variables: Variable[];
}

interface OperationNodeProps extends NodeEditorProps {}

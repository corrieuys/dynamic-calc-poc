/// <reference types="react" />
import React, { useState } from "react";
import { calculateAll } from "./dynamicCalculator.ts";
import initialData from "./initialJson.json" ;

// Define interfaces
export interface Variable {
  name: string;
  value: number;
}

export interface Expression {
  operation?: string;
  operands?: Expression[];
  variable?: string;
  literal?: number;
  comparator?: string;
}

// Update interface: rename CalculatorList to CalculationGroup with "calculations" field.
export interface CalculationGroup {
  calculations: {
    name: string;
    outputVariable: string;
    calculator: Expression;
  }[];
}

export const initialVariables: Variable[] = [
  { name: "coverAmount", value: 100 },
  { name: "accidentalFactor", value: 1.5 },
  { name: "topUpExpenseFactor", value: 0.8 },
];

export const operationTypes: string[] = ["add", "subtract", "multiply", "divide", "if", "max", "set"];

export function App(): JSX.Element {
  // Use CalculationGroup type
  const [data, setData] = useState<CalculationGroup>(initialData);
  const [variables, setVariables] = useState<Variable[]>(initialVariables);
  const [results, setResults] = useState<number[] | null>(null);

  // New: Add a new calculation with default values.
  const addCalculation = (): void => {
    const newCalc = {
      name: "New Calculation",
      outputVariable: "newOutput",
      calculator: { literal: 0 },
    };
    setData({ ...data, calculations: [...data.calculations, newCalc] });
  };

  const addVariable = (): void => setVariables([...variables, { name: "", value: 0 }]);
  const updateVariable = (index: number, key: string, value: any): void =>
    setVariables(variables.map((v: any, i: any) => (i === index ? { ...v, [key]: value } : v)));

  const calculateResult = (): void => {
    try {
      const res = calculateAll(data.calculations, variables);
      // Build a lookup from current variables.
      const newVarsMap: Record<string, number> = {};
      variables.forEach((v:any) => {
        newVarsMap[v.name] = v.value;
      });
      // Merge or add each calculation's output variable.
      data.calculations.forEach((calc:any, idx:number) => {
        newVarsMap[calc.outputVariable] = res.details[idx]?.total;
      });
      // Convert lookup back to array.
      const newVarList = Object.entries(newVarsMap).map(([name, value]) => ({ name, value }));
      setVariables(newVarList);
      // Set results to the new structure with grand total and details.
      setResults(res);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // New: Remove a calculation from the list.
  const removeCalculation = (index: number): void => {
    const newCalcs = data.calculations.filter((_:any, i: number) => i !== index);
    setData({ ...data, calculations: newCalcs });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Dynamic calculator builder</h1>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          {/* Render and edit all calculations */}
          {data.calculations.map((calc: any, index: number) => (
            <div key={index} style={{ border: "1px solid #aaa", padding: "10px", marginBottom: "10px" }}>
              <div>
                <label>Name: </label>
                <input
                  type="text"
                  value={calc.name}
                  onChange={(e: any) => {
                    const newCalcs = [...data.calculations];
                    newCalcs[index].name = e.target.value;
                    setData({ ...data, calculations: newCalcs });
                  }}
                />
              </div>
              <div>
                <label>Output Variable: </label>
                <input
                  type="text"
                  value={calc.outputVariable}
                  onChange={(e: any) => {
                    const newCalcs = [...data.calculations];
                    newCalcs[index].outputVariable = e.target.value;
                    setData({ ...data, calculations: newCalcs });
                  }}
                />
              </div>
              <button onClick={() => removeCalculation(index)}>Remove Calculation</button>
              <NodeEditor
                node={calc.calculator}
                onChange={(newCalc) => {
                  const newCalculations = [...data.calculations];
                  newCalculations[index].calculator = newCalc;
                  setData({ ...data, calculations: newCalculations });
                }}
                variables={variables}
              />
            </div>
          ))}
          <button onClick={calculateResult}>Calculate All</button>
          <button onClick={addCalculation}>Add Calculation</button>
          {results && (
            <div>
              <h2>Results</h2>
              <div>
                <strong>Grand Total: </strong> {results.total}
              </div>
              <div>
                <h3>Details:</h3>
                <ul>
                  {results.details.map((detail: any, idx: any) => (
                    <li key={idx}>
                      {detail.name}: {detail.total}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, marginLeft: "20px" }}>
          <h2>Variables</h2>
          {variables.map((v: any, index: any) => (
            <div key={index}>
              <input
                type="text"
                value={v.name}
                placeholder="Variable Name"
                onChange={(e: any) => updateVariable(index, "name", e.target.value)}
              />
              <input
                type="number"
                value={v.value}
                placeholder="Value"
                onChange={(e: any) => updateVariable(index, "value", Number(e.target.value))}
              />
            </div>
          ))}
          <button onClick={addVariable}>Add Variable</button>
          <h2>Output JSON</h2>
          <pre style={{ background: "#f4f4f4", padding: "10px" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface NodeEditorProps {
  node: Expression;
  onChange: (node: Expression) => void;
  variables: Variable[];
}

// Replace the old NodeEditor implementation with the following updated version:
export function NodeEditor({ node, onChange, variables }: NodeEditorProps): JSX.Element {
  // Determine current type based on properties.
  const currentType =
    node.literal !== undefined ? "literal" : node.variable ? "variable" : node.operation ? "operation" : "literal";

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    if (newType === currentType) return;
    if (newType === "literal") onChange({ literal: 0 });
    else if (newType === "variable") onChange({ variable: variables[0]?.name || "" });
    else if (newType === "operation") onChange({ operation: operationTypes[0] || "", operands: [] });
  };

  return (
    <div>
      <label style={{ marginRight: "5px" }}>Type:</label>
      <select value={currentType} onChange={handleTypeChange}>
        <option value="literal">Literal</option>
        <option value="variable">Variable</option>
        <option value="operation">Operation</option>
      </select>
      <div style={{ marginTop: "5px" }}>
        {currentType === "literal" ? (
          <input
            type="number"
            value={node.literal}
            onChange={(e:any) => onChange({ ...node, literal: Number(e.target.value) })}
          />
        ) : currentType === "variable" ? (
          <select
            value={node.variable}
            onChange={(e:any) => onChange({ ...node, variable: e.target.value })}
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

interface OperationNodeProps extends NodeEditorProps {}

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
    onChange({ ...node, operands: (node.operands || []).filter((_: Expression, i: number) => i !== index) });
  };

  const addOperand = (type: string): void => {
    const newOperand: Expression =
      type === "literal"
        ? { literal: 0 }
        : type === "variable"
        ? { variable: variables[0]?.name || "" }
        : { operation: type, operands: [] };
    onChange({ ...node, operands: [...(node.operands || []), newOperand] });
  };

  const [selectedOperandType, setSelectedOperandType] = useState("");

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <label>
        <strong>Operation: </strong>
        <select value={node.operation} onChange={handleOperationChange}>
          {operationTypes.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </label>
      {node.operation === "if" ? (
        <div>
          <div>
            <label>
              <strong>Comparator: </strong>
              <select
                value={node.comparator || ""}
                onChange={(e: any) => onChange({ ...node, comparator: e.target.value })}
              >
                <option value="">Select Comparator</option>
                <option value=">">&gt;</option>
                <option value=">=">&gt;=</option>
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value="<">&lt;</option>
                <option value="<=">&lt;=</option>
              </select>
            </label>
          </div>
          <div>
            <div style={{ marginTop: "10px" }}>
              <label><strong>Input:</strong></label>
              <NodeEditor
                node={node.operands && node.operands[0] ? node.operands[0] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(0, operand)}
                variables={variables}
              />
            </div>
            <div style={{ marginTop: "10px" }}>
              <label><strong>Compare Value:</strong></label>
              <NodeEditor
                node={node.operands && node.operands[1] ? node.operands[1] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(1, operand)}
                variables={variables}
              />
            </div>
            <div style={{ marginTop: "10px" }}>
              <label><strong>Then:</strong></label>
              <NodeEditor
                node={node.operands && node.operands[2] ? node.operands[2] : { literal: 0 }}
                onChange={(operand) => handleOperandChange(2, operand)}
                variables={variables}
              />
            </div>
            <div style={{ marginTop: "10px" }}>
              <label><strong>Else:</strong></label>
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
          <strong>Operands: </strong>
          {node.operands?.map((operand, index: number) => (
            <div key={index} style={{ marginLeft: "20px" }}>
              <NodeEditor
                node={operand}
                onChange={(updatedOperand: Expression) => handleOperandChange(index, updatedOperand)}
                variables={variables}
              />
              <button onClick={() => removeOperand(index)}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: "10px" }}>
            <select
              value={selectedOperandType}
              onChange={(e: any) => setSelectedOperandType(e.target.value)}
            >
              <option value="">Select Operand Type</option>
              <option value="literal">Literal</option>
              <option value="variable">Variable</option>
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
              style={{ marginLeft: "5px" }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

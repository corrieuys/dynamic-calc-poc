// Interfaces matching the ones used in App.tsx
export interface Expression {
    operation?: string;
    operands?: Expression[];
    variable?: string;
    literal?: number;
    // New: comparator property for if operations.
    comparator?: string;
}

export interface Variable {
    name: string;
    value: number;
}

// New: Interface for calculator configuration
export interface CalculatorConfig {
    name: string;
    outputVariable: string;
    calculator: Expression;
}

// Recursively evaluates an expression using the provided variables dictionary.
function evaluateExpression(expr: Expression, vars: Record<string, number>): number {
    // Literal node.
    if (expr.literal !== undefined) {
        return expr.literal;
    }
    // Variable node.
    if (expr.variable) {
        if (vars[expr.variable] === undefined) {
            throw new Error(`Variable '${expr.variable}' not provided.`);
        }
        return vars[expr.variable];
    }
    // Operation node.
    if (expr.operation) {
        const op = expr.operation.toLowerCase();
        const operands = expr.operands || [];
        switch (op) {
            case "add":
                return operands.reduce((sum, operand) => sum + evaluateExpression(operand, vars), 0);
            case "subtract":
                if (operands.length !== 2) throw new Error("Subtract requires exactly 2 operands.");
                return evaluateExpression(operands[0], vars) - evaluateExpression(operands[1], vars);
            case "multiply":
                return operands.reduce((prod, operand) => prod * evaluateExpression(operand, vars), 1);
            case "divide":
                {
                    if (operands.length !== 2) throw new Error("Divide requires exactly 2 operands.");
                    const divisor = evaluateExpression(operands[1], vars);
                    if (divisor === 0) throw new Error("Division by zero.");
                    return evaluateExpression(operands[0], vars) / divisor;
                }
            case "if":
                {// New if: expects 4 operands: input, compare, then, else.
                    if (operands.length !== 4) {
                        throw new Error("If requires exactly 4 operands: input, compare, then, else.");
                    }
                    if (!expr.comparator) {
                        throw new Error("If operation requires a comparator property.");
                    }
                    const left = evaluateExpression(operands[0], vars);
                    const right = evaluateExpression(operands[1], vars);
                    let conditionTrue: boolean;
                    switch (expr.comparator) {
                        case ">":
                            conditionTrue = left > right;
                            break;
                        case ">=":
                            conditionTrue = left >= right;
                            break;
                        case "==":
                            conditionTrue = left === right;
                            break;
                        case "!=":
                            conditionTrue = left !== right;
                            break;
                        case "<":
                            conditionTrue = left < right;
                            break;
                        case "<=":
                            conditionTrue = left <= right;
                            break;
                        default:
                            throw new Error(`Unsupported comparator: ${expr.comparator}`);
                    }
                    return conditionTrue
                        ? evaluateExpression(operands[2], vars)
                        : evaluateExpression(operands[3], vars);
                }
            case "max":
                return Math.max(...operands.map(operand => evaluateExpression(operand, vars)));
            default:
                throw new Error(`Unsupported operation type: ${expr.operation}`);
        }
    }
    throw new Error("Invalid expression structure.");
}

// Converts a variable array to a lookup object and evaluates the expression.
export function calculate(
    expr: Expression,
    variableList: Variable[]
): number {
    const vars: Record<string, number> = {};
    variableList.forEach(v => {
        vars[v.name] = v.value;
    });
    return evaluateExpression(expr, vars);
}

// New: Function to run multiple calculators sequentially.
export function calculateAll(
    calculators: CalculatorConfig[],
    variableList: Variable[]
): { total: number; details: { name: string; total: number }[] } {
    const details: { name: string; total: number }[] = [];
    const vars: Record<string, number> = {};
    // Initialize variable lookup from starting list.
    variableList.forEach(v => { vars[v.name] = v.value; });
    // Process each calculator in sequence.
    calculators.forEach(calcConfig => {
        const output = evaluateExpression(calcConfig.calculator, vars);
        vars[calcConfig.outputVariable] = output;
        details.push({ name: calcConfig.name, total: output });
    });
    // Grand total is the output of the last calculator
    const grandTotal = details.length > 0 ? details[details.length - 1].total : 0;
    return { total: grandTotal, details };
}

// ...existing code if needed...

export interface Expression {
    type?: string;
    operation?: string;
    operands?: Expression[];
    variable?: string;
    literal?: any;
    comparator?: string;
    calculationExpression?: Expression;
}

export interface Variable {
    name: string;
    value: any;
}

export interface CalculatorConfig {
    calculationName: string;
    outputVariable: string;
    calculationExpression: Expression;
}

function evaluateExpression(expr: Expression, vars: Record<string, any>): any {
    if (expr.calculationExpression) {
        return evaluateExpression(expr.calculationExpression, vars);
    }

    if (expr.literal !== undefined) {
        return expr.literal;
    }

    if (expr.variable) {
        if (vars[expr.variable] === undefined) {
            throw new Error(`Variable '${expr.variable}' not provided.`);
        }
        return vars[expr.variable];
    }

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
                {
                    if (operands.length !== 4) {
                        throw new Error("If requires exactly 4 operands: input, compare, then, else.");
                    }
                    if (!expr.comparator) {
                        throw new Error("If operation requires a comparator property.");
                    }

                    const left = evaluateExpression(operands[0], vars);
                    const right = evaluateExpression(operands[1], vars);
                    let conditionTrue: boolean;

                    if (expr.comparator === "isStringValue") {
                        // String comparison
                        conditionTrue = String(left) === String(right);
                    } else {
                        // Numeric comparisons
                        switch (expr.comparator) {
                            case ">": conditionTrue = left > right; break;
                            case ">=": conditionTrue = left >= right; break;
                            case "==": conditionTrue = left === right; break;
                            case "!=": conditionTrue = left !== right; break;
                            case "<": conditionTrue = left < right; break;
                            case "<=": conditionTrue = left <= right; break;
                            default: throw new Error(`Unsupported comparator: ${expr.comparator}`);
                        }
                    }

                    return conditionTrue ?
                        evaluateExpression(operands[2], vars) :
                        evaluateExpression(operands[3], vars);
                }
            case "max":
                return Math.max(...operands.map(operand => evaluateExpression(operand, vars)));
            default:
                throw new Error(`Unsupported operation type: ${expr.operation}`);
        }
    }
    throw new Error("Invalid expression structure.");
}

export function calculate(expr: Expression, variableList: Variable[]): any {
    const vars: Record<string, any> = {};
    variableList.forEach(v => { vars[v.name] = v.value; });
    return evaluateExpression(expr, vars);
}

export function calculateAll(
    calculators: CalculatorConfig[],
    variableList: Variable[]
): { total: number; details: { name: string; total: any }[] } {
    const details: { name: string; total: any }[] = [];
    const vars: Record<string, any> = {};
    variableList.forEach(v => { vars[v.name] = v.value; });

    calculators.forEach(calcConfig => {
        const output = evaluateExpression(calcConfig.calculationExpression, vars);
        vars[calcConfig.outputVariable] = output;
        details.push({ name: calcConfig.calculationName, total: output });
    });

    const grandTotal = details.length > 0 ? details[details.length - 1].total : 0;
    return { total: grandTotal, details };
}
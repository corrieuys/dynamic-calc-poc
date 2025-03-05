import initialData from "../initialJson.json";
import { CalculatorSchema } from "../App";

// Transform JSON data to match application schema
export const adaptInitialData = (): CalculatorSchema => {
    // The JSON structure already matches our updated interface
    // No need for complex transformations
    return initialData as CalculatorSchema;
};

// Additional calculator utility functions can be added here

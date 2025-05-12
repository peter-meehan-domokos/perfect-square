import { LiberalNumber } from "@/app/common-types/data-types";
import { TransformerFactory, ConvertToPercentageOptions } from "../common-types/function-types";
import * as d3 from 'd3';

//guards against NaN for number types, and other invalid states for LiberalNumber types,
// and also returns true for 0, so a better way to check using than !number
export const isNumber = (number : LiberalNumber) => typeof number === "number" && !isNaN(number);

export const percentageScoreConverterFactory : TransformerFactory<LiberalNumber, number | undefined, ConvertToPercentageOptions> = (
    liberalTargetValue, 
    options = {}
    ) => (liberalValue) => {
        const { 
            dps=0, 
            defaultValue, 
            customRange, 
            allowGreaterThan100 = false, 
            allowLessThanZero = false,
            useRangeAsBound = false
        } = options;
        const print = liberalTargetValue === 10 && liberalValue === 1;

        //try to convert values to number if string
        const targetValue = typeof liberalTargetValue === "string" ? Number(liberalTargetValue) : liberalTargetValue;
        const value = typeof liberalValue === "string" ? Number(liberalValue) : liberalValue;
        //check for invalid values
        if(typeof targetValue !== "number" || isNaN(targetValue) || typeof value !== "number" || isNaN(value)){
            return typeof defaultValue === "number" && !isNaN(defaultValue) ? defaultValue : undefined;
        }
        const range = customRange || [0, targetValue];
        const rangeSize = Math.abs(range[1] - range[0]);
        const direction = range[1] - range[0] >= 0 ? "increasing" : "decreasing";
        const quantityOfRangeAchieved = direction === "increasing" ? value - range[0] : range[1] - value;
        const pc = Number(((quantityOfRangeAchieved/rangeSize) * 100).toFixed(dps));
        const lowerBound = allowLessThanZero && pc < 0 ? pc : 0;
        const upperBound = allowGreaterThan100 && pc > 100 ? pc : 100;

        //2nd arg ensures correct overload of d3.min is inferred
        return d3.min([upperBound, d3.max([lowerBound, pc])], d => d);
}



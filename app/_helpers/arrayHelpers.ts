import { AccessorFn } from '@/app/types/function-types';
import * as d3 from 'd3';

//helpers
//@todo - use something like T extends Sortable so it works for number, date, string and not much else
export function sortAscending<T>(
  arr : T[], 
  accessor : AccessorFn<T, number | null | undefined>
  ):T[] {
  const dataCopy = arr.map(d => d);
  //d3.ascending cannot handle null values so convert any nulls to undefined
  return dataCopy.sort((a, b) => d3.ascending(accessor(a) || undefined, accessor(b) || undefined))
};

/**
 * @description Sorts an array in descending order based on values returned by an accessor function
 * 
 * @template T - The type of elements in the array
 * @param {T[]} arr - The array to sort
 * @param {(item: T) => number | null | undefined} accessor - Function to access the numeric value to sort by
 * @returns {T[]} A new sorted array
 */
export function sortDescending<T>(
  arr : T[], 
  accessor : AccessorFn<T, number | null | undefined>
  ):T[] {
  const dataCopy = arr.map(d => d);
  //d3.descending cannot handle null values so convert any nulls to undefined
  return dataCopy.sort((a, b) => d3.descending(accessor(a) || undefined, accessor(b) || undefined))
};

export function immutableReverse<T>(arr : T[]): T[] {
    const copy = arr.map(d => d)
    copy.reverse()
    return copy;
}

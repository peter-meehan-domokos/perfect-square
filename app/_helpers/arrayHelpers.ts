import { AccessorFn, TransformWithAccessorFn, TransformFn } from '../common-types/function-types';
import * as d3 from 'd3';

//helpers
//@todo - add a type that extends Sortable or whatever the type, so accessor can return other sortable types eg dates
export function sortAscending<T>(
  arr : T[], 
  accessor : AccessorFn<T, number>
  ):T[] {
  const dataCopy = arr.map(d => d);
  return dataCopy.sort((a, b) => d3.ascending(accessor(a), accessor(b)))
};

export function sortDescending<T>(
  arr : T[], 
  accessor : AccessorFn<T, number>
  ):T[] {
  const dataCopy = arr.map(d => d);
  return dataCopy.sort((a, b) => d3.descending(accessor(a), accessor(b)))
};

export function immutableReverse<T>(arr : T[]): T[] {
    const copy = arr.map(d => d)
    copy.reverse()
    return copy;
}

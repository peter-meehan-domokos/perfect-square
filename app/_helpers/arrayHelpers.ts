import { AccessorFn, TransformWithAccessorFn } from '../common-types/function-types';
import * as d3 from 'd3';
import { Transform } from 'stream';

//helpers
//@todo - replace any with more complex type to ensure a valid accessor is passed,
//and that a valid array type is returned
export const sortAscending : TransformWithAccessorFn<any, any> = (
  data : any[], 
  accessor : AccessorFn<any, any> = d => d
  ):any[] => {
  const dataCopy = data.map(d => d);
  return dataCopy.sort((a, b) => d3.ascending(accessor(a), accessor(b)))
};

export function sortDescending(data, accessor =  d => d){
	const dataCopy = data.map(d => d);
	return dataCopy.sort((a, b) => d3.descending(accessor(a), accessor(b)))
  };

export function immutableReverse(arr){
    const copy = arr.map(d => d)
    copy.reverse()
    return copy;
}

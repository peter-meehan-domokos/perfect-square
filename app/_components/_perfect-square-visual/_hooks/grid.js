'use client'
import { useState, useCallback, useEffect } from "react";
import { CALC_CELL_MARGIN } from "../constants";

const _cellXCalculator = cellWidth => colNr => colNr * cellWidth;
const _cellYCalculator = cellHeight => rowNr => rowNr * cellHeight;

export const useGrid = (width, height, nrCells=0) => {
  const [nrCols, setNrCols] = useState(1);
  const [nrRows, setNrRows] = useState(1);
  const [cellWidth, setCellWidth] = useState(0);
  const [cellHeight, setCellHeight] = useState(0);
  const [cellMargin, setCellMargin] = useState({ left:0, right:0, top:0, bottom:0 })
  
  //utility methods for each cell
  const _cellX = useCallback(_cellXCalculator(cellWidth), [cellWidth]);
  const _cellY = useCallback(_cellYCalculator(cellHeight), [cellHeight]);
  const _rowNr = useCallback(cellIndex => Math.floor(cellIndex / nrCols), [nrCols]);
  const _colNr = useCallback(cellIndex => cellIndex % nrCols, [nrCols]);

  useEffect(() => {
    const { nrCols, nrRows } = calcNrColsAndRows(width, height, nrCells);
    setNrCols(nrCols);
    setNrRows(nrRows);
    const cellWidth = width/nrCols;
    const cellHeight = height/nrRows;
    setCellWidth(cellWidth);
    setCellHeight(cellHeight);
    setCellMargin(CALC_CELL_MARGIN(cellWidth, cellHeight));
  },[width, height, nrCells])
  
  return { nrCols, nrRows, nrCells, cellWidth, cellHeight, cellMargin, _cellX, _cellY, _rowNr, _colNr }

};


  /**
 * @description Calculates the optimum number of rows and columns for a given number of cells within a space
 *
 * @param {object} width the width of the space
 * @param {object} height the height of the space
 * @param {object} nrCells the number of cells that are required to fit in the space
 * 
 * @returns {object} contains the values for the optimum number of rows and columns
 */
function calcNrColsAndRows(width, height, nrCells){
  if(!width || !height || !nrCells) { return { nrCols: 1, nrRows: 1 }}
    //aspect ratio, a
    const asp = width / height;
    const proportionOfCellsForWidth = Math.sqrt(nrCells * asp);
    const nrCols = Math.round(proportionOfCellsForWidth);
    //always round up the rows so there is enough cells
    const nrRows = Math.ceil(nrCells/nrCols);
    //@todo - consider adjusting cols if ther is an orphan on last row ie 
    //const nrOnLastRow = n - (nrRows-1) * nrCols;
    return { nrCols, nrRows }
}
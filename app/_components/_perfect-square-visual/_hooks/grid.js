'use client'
import { CALC_CELL_MARGIN } from "../constants";

const _cellXCalculator = cellWidth => colNr => colNr * cellWidth;
const _cellYCalculator = cellHeight => rowNr => rowNr * cellHeight;

const calcGrid = (width, height, nrCells=0) => {
    const { nrCols, nrRows } = calcNrColsAndRows(width, height, nrCells);
    const cellWidth = width/nrCols;
    const cellHeight = height/nrRows;
    const cellMargin = CALC_CELL_MARGIN(cellWidth, cellHeight);
    const _cellX = _cellXCalculator(cellWidth);
    const _cellY = _cellYCalculator(cellHeight);
    const _rowNr = cellIndex => Math.floor(cellIndex / nrCols);
    const _colNr = cellIndex => cellIndex % nrCols;
  
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
    const aspectRatio = width / height;
    const proportionOfCellsForWidth = Math.sqrt(nrCells * aspectRatio);
    const nrCols = Math.round(proportionOfCellsForWidth);
    //always round up the rows so there is enough cells
    const nrRows = Math.ceil(nrCells/nrCols);
    //@todo - consider adjusting cols if ther is an orphan on last row ie 
    //const nrOnLastRow = n - (nrRows-1) * nrCols;
    return { nrCols, nrRows }
}

export default calcGrid;
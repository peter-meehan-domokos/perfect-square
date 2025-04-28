'use client'
import React, { } from 'react';
import { resetIcon } from "../../../assets/svgIcons";
import { COLOURS } from "../../../constants";
const { BLUE, GREY } = COLOURS;

/**
 * @description This component renders....
 *
 * @param {string} name .....
 * @returns {ReactNode} A React element that renders....
 */
const ZoomCtrls = ({ zoomTransformState={}, resetZoom }) => { 
  const { x, y, k } = zoomTransformState;
  const isZoomedOrPanned = x || y || k > 1;
  return (
    <div className="zoom-ctrls">
        <div className="ctrls-section-label">Reset Zoom</div>
        <div className="zoom-btns">
          <div className="zoom-reset-icon" style={{ cursor: isZoomedOrPanned ? "pointer" : null }}>
            <svg width={resetIcon.width} height={resetIcon.height} onClick={resetZoom} >
              <path d={resetIcon.path.d} fill={isZoomedOrPanned ? BLUE : GREY} style={{ transition:"fill 200ms"}}
                fillRule={resetIcon.path.fillrule} transform={resetIcon.path.transform} 
              />
            </svg>
          </div>
        </div>
    </div>   
  )
}

export default ZoomCtrls;



'use client'
import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import Overview from './Overview';
import ZoomCtrls from './ZoomCtrls';
import SettingsCtrls from './SettingsCtrls';
import quadrantCtrlsComponent from "./quadrantCtrlsComponent";

const PerfectSquareHeader = ({ data={}, settings, zoomTransform, headerExtended=false, selectedQuadrantIndex, onClickZoom, resetZoom, setSettings, setSelectedQuadrantIndex, setHeaderExtended, setTooltipsData }) => { 
    const { categories, nrDatapoints, title, desc } = data;
    const quadrantCtrls = useMemo(() => quadrantCtrlsComponent(), []);
    //refs
    const containerRef = useRef(null);
    //handler
    const toggleHeaderExtended = e => { setHeaderExtended(!headerExtended); }
    //render quadrantCtrls
    useEffect(() => {
        const quadrantCtrlsData = categories;
        if(!quadrantCtrlsData){ return; }

        d3.select(containerRef.current)
            ?.datum(quadrantCtrlsData)
            .call(quadrantCtrls
            .width(159)
            .height(44)
            .margin({ left:0, right: 0, top: 0, bottom:0 })
            .selectedQuadrantIndex(selectedQuadrantIndex)
            .setSelectedQuadrantIndex(setSelectedQuadrantIndex));

    }, [quadrantCtrls, selectedQuadrantIndex, setSelectedQuadrantIndex, categories])

  return (
      <div className={`viz-header ${headerExtended ? "extended" : ""}`} >
        <Overview key={data.key} title={title} desc={desc} headerExtended={headerExtended} toggleHeaderExtended={toggleHeaderExtended} />
        <div className="visual-ctrls" style={{ pointerEvents:nrDatapoints === 0 ? "none" : "all" }}>
          <div className="interaction-ctrls">
            <div className="quadrant-ctrls">
              <div className="ctrls-section-label">Select</div>
              <div className="quadrant-ctrls-diagram">
                <svg ref={containerRef}></svg>
              </div>
            </div>
            <ZoomCtrls zoomTransform={zoomTransform}  onClickZoom={onClickZoom} resetZoom={resetZoom} />
          </div>
          <SettingsCtrls settings={settings} setSettings={setSettings} setTooltipsData={setTooltipsData} />
        </div>
      </div>
  )
}

export default PerfectSquareHeader;



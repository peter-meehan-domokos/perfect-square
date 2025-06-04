'use client'
import React, { useRef, useEffect, useMemo, useContext, useCallback } from 'react';
import { AppContext } from "@/app/context";
import { VisualContext } from '../context';
import { TooltipsContext } from '../SVGVisual/hooks_and_modules/tooltips/context';
import * as d3 from 'd3';
import Overview from './Overview';
import ZoomCtrls from './ZoomCtrls';
import SettingsCtrls from './SettingsCtrls';
import quadrantCtrlsComponent from "./quadrantCtrlsComponent";
import { RESET_ZOOM_DURATION } from "@/app/constants";

/**
 * @description 
 *
 * @returns {ReactElement} 
 */
const VisualHeader = () => { 
  const { 
    visualDataResult:{ data }={},
    device
  } = useContext(AppContext);
  const { 
    headerExtended, setHeaderExtended, 
    selectedQuadrantIndex, setSelectedQuadrantIndex,
    displaySettings, setDisplaySettings,
    zoomTransform, setExternallyRequiredZoomTransformObject
  } = useContext(VisualContext);

  const { 
    setHeaderTooltipsData 
  } = useContext(TooltipsContext);
  

  const quadrantCtrls = useMemo(() => quadrantCtrlsComponent(), []);
  //refs
  const containerRef = useRef(null);
  //handler
  const toggleHeaderExtended = e => { setHeaderExtended(!headerExtended); }
  //render quadrantCtrls
  useEffect(() => {
      const quadrantCtrlsData = data?.categories;
      if(!quadrantCtrlsData){ return; }

      d3.select(containerRef.current)
          ?.datum(quadrantCtrlsData)
          .call(quadrantCtrls
          .width(159)
          .height(44)
          .margin({ left:0, right: 0, top: 0, bottom:0 })
          .selectedQuadrantIndex(selectedQuadrantIndex)
          .setSelectedQuadrantIndex(setSelectedQuadrantIndex));

  }, [quadrantCtrls, selectedQuadrantIndex, setSelectedQuadrantIndex, data?.categories])

  const handleExternalResetZoom = useCallback(() => {
    const requiredTransition = { duration: RESET_ZOOM_DURATION };
    setExternallyRequiredZoomTransformObject({ requiredTransform: d3.zoomIdentity, requiredTransition });
  }, [setExternallyRequiredZoomTransformObject])

  return (
      <div className={`vis-header ${headerExtended ? "extended" : ""}`} >
        <Overview key={data?.key || ""} title={data?.title} desc={data?.desc} headerExtended={headerExtended} toggleHeaderExtended={toggleHeaderExtended} />
        <div className="visual-ctrls" style={{ pointerEvents:data?.nrDatapoints === 0 ? "none" : "all" }}>
          <div className="interaction-ctrls">
            <div className="quadrant-ctrls">
              <div className="ctrls-section-label">Select</div>
              <div className="quadrant-ctrls-diagram">
                <svg ref={containerRef}></svg>
              </div>
            </div>
            <ZoomCtrls zoomTransform={zoomTransform} resetZoom={handleExternalResetZoom} />
          </div>
          <SettingsCtrls 
            settings={displaySettings} 
            setSettings={setDisplaySettings} 
            setHeaderTooltipsData={setHeaderTooltipsData}
            device={device} />
        </div>
      </div>
  )
}

export default VisualHeader;



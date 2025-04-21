'use client';
import { useContext } from 'react';
import { AppContext } from '@/app/context';
import { VisualContext } from './context';

function oldSVGVisualLayout({ withGrid=true, children }) {
    //@todo remove ={} once we have LoadingFallback
    const { visualData:{ data }={} } = useContext(AppContext);
    const {  } = useContext(VisualContext);

    return (
        <div className="vis-layout" ref={containerDivRef}>
            <svg className="vis" width="100%" height="100%" ></svg>
        </div>
    )
}
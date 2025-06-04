//@ts-nocheck
'use client'
import { ReactElement, useRef, useContext, useCallback } from 'react';
import * as d3 from 'd3';
import { AppContext } from '@/app/context';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { INTRO_SLIDES } from '@/app/assets/static-content/intro-content';
import SlideLayout from './slide/layout';
import Slide from './slide/page';

const nextSlideButtonStyle = {
    border:"solid", borderWidth:0.8
}
const playButtonStyle = {
    background:"#BF40BF"
}

/**
 * @description Renders a third party Slider that contains the intro text to the app
 * 
 * @param {function} closeIntro a handler that sets the state in the parent to close the intro and render the visual
 * 
 * @returns {ReactElement} A div containing a React-Slick Slider component
 */
const Intro : React.FC = () => {
    const { setIntroIsDisplayed } = useContext(AppContext);
    const sliderRef = useRef<Slider | null> (null);
    const skipIntroBtnRef = useRef<HTMLButtonElement | null>(null);
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
      };
      
    const closeIntro = useCallback(() => setIntroIsDisplayed(false), [setIntroIsDisplayed])

    const goToNextSlide = () => {  
        sliderRef.current?.slickNext();
    }

    const _isLastSlide = (i : number) => i === INTRO_SLIDES.length - 1;

    const _controlButtons = (isLastSlide: boolean) => [{
        label:isLastSlide ? "Play" : "Next",
        onClick:isLastSlide ? closeIntro : goToNextSlide,
        className:`${isLastSlide ? "last-slide-controls" : "slide-controls"}`,
        style:isLastSlide ? playButtonStyle : nextSlideButtonStyle
    }]

    const handleChange = (currentSlide: number, nextSlide: number) => {
        d3.select(skipIntroBtnRef.current)
            .classed("display-none", nextSlide === INTRO_SLIDES.length - 1);
    }

    return (
        <div className="intro">
            <button className="skip-intro-btn" onClick={closeIntro} ref={skipIntroBtnRef}>
              Skip intro
           </button>
            <div className="intro-slider-container">
                <Slider {...settings} ref={sliderRef} arrows={false} beforeChange={handleChange}>
                    {INTRO_SLIDES.map((slide, i) => 
                        <SlideLayout 
                            key={`slide-${i}`}
                            containerClassNames={_isLastSlide(i) ? "last-slide" : ""}
                            controlButtons={_controlButtons(_isLastSlide(i))} 
                            footer={slide.footer}
                        >
                            <Slide 
                                i={i}
                                title={slide.title} 
                                paragraphs={slide.paragraphs} 
                                visual={slide.visual}
                            />
                        </SlideLayout>
                    )}
                </Slider>
            </div>
        </div>
    )
}
  
export default Intro;
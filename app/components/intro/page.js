'use client'
import { useRef } from 'react';
import Image from 'next/image'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { INTRO_SLIDES } from '@/app/static-content/intro-content';
import profile from './profile.png';
import { bokorFont, robotoFont, robotoBoldFont, robotoMonoFont } from '@/app/assets/fonts';

//style overrides
const titleStyle = {
    margin:"2% 0",
    //fontFamily:robotoMonoFont
}

const paragraphStyle = {
    margin:"2% 2.5%",
    //fontFamily:robotoMonoFont
}

const nextSlideButtonStyle = {
    border:"solid",
}
const playButtonStyle = {
    background:"#BF40BF"
}
const Intro = ({ closeIntro }) => {
    const sliderRef = useRef(null);
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
      };

    const goToNextSlide = () => {  sliderRef.current.slickNext(); }

    const isLastSlide = i => i === INTRO_SLIDES.length - 1;

    return (
        <div className="intro">
            <button className="skip-intro-btn" onClick={closeIntro}>
              Skip intro
           </button>
            <div className="intro-slider-container">
                <Slider {...settings} ref={sliderRef} arrows={false}>
                    {INTRO_SLIDES.map((slide, i) => 
                        <div className={`intro-slide-container ${isLastSlide(i) ? "last-slide" : ""}`} key={`slide-${i}`}>
                            <div className="intro-slide">
                                <div className="slide-main-contents">
                                    <div className="intro-slide-text-container">
                                        {slide.title &&
                                            <h2 className={`slide-title ${robotoBoldFont.className}`} style={titleStyle}>{slide.title}</h2>
                                        }
                                        {slide.paragraphs.map((p,j) => 
                                            <p className={`slide-textline ${robotoFont.className}`} key={`slide-${i}-para-${j}`} style={paragraphStyle}>{p}</p>
                                        )}
                                    </div>
                                    {slide.visual &&
                                        <div className="intro-slide-visual">
                                            <div className="intro-vis-container">vis container</div>
                                        </div>
                                    }
                                </div>
                                <div className={`${isLastSlide(i) ? "last-slide-controls" : "slide-controls"}`}>
                                    <button 
                                        onClick={isLastSlide(i) ? closeIntro : goToNextSlide} 
                                        style={isLastSlide(i) ? playButtonStyle : nextSlideButtonStyle}
                                    >
                                        {isLastSlide(i) ? "Play" : "Next"}
                                    </button>
                                </div>
                                {slide.footer &&
                                    <div className="slide-footer-container">
                                        <div className="slide-footer">
                                            <div className="slide-footer-visual">
                                                <Image className="image" src={profile} alt="profile-photo" />
                                            </div>
                                            <ul className="slide-footer-items-list">
                                                {slide.footer.items.map(item => 
                                                    <li key={item.key}>
                                                        {item.url ?
                                                            <a 
                                                                className={`slide-footer-item url-item ${robotoMonoFont.className}`}
                                                                href={item.url}
                                                                target="_blank"
                                                            >
                                                                {item.label}
                                                            </a>
                                                            :
                                                            <h5 className={`slide-footer-item ${robotoMonoFont.className}`}>{item.label}</h5>
                                                        } 
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    )}
                </Slider>
            </div>
        </div>
    )
}
  
export default Intro;
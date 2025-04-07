import { robotoFont, robotoBoldFont } from '@/app/assets/fonts';
import Image from 'next/image';

//style overrides
const titleStyle = {
    margin:"2% 0",
}

const paragraphStyle = {
    margin:"2% 2.5%",
}

/**
 * @description Renders the contents intended to be used for a slide in a slider
 * 
 * @param {string} id an optional unique identifier, could be the index of the slide for example
 * @param {string} title the title of the slide
 * @param {Array} paragraphs an array of paragraphs of text to be renderd in p elements
 * @param {object} visual an optional object that can contain an image with a src url, and/or an array of text
 * 
 * @returns {HTMLElement} A div containing the content that has been passed in
 */

//@todo - move static content to proper place in a text file
 const Slide = ({ id="", title="", paragraphs=[], visual }) => {
    return (
        <div className="slide-main-contents">
            <div className="intro-slide-text-container">
                {title &&
                    <h2 className={`slide-title ${robotoBoldFont.className}`} style={titleStyle}>{title}</h2>
                }
                {paragraphs.map((p,j) => 
                    <p className={`slide-textline ${robotoFont.className}`} key={`slide-${id}-para-${j}`} style={paragraphStyle}>{p}</p>
                )}
            </div>
            {visual &&
                <div className="intro-slide-visual">
                    <div className="intro-vis-container">
                        <Image className="image" src={visual.src} alt="profile-photo" width={0} height={0} />
                    </div>
                </div>
            }
        </div>
    )
}
  
export default Slide;
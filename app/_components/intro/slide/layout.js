'use client';
import Controls from './controls/page';
import Footer from './footer/page';

/**
 * @description Renders a wrapper for a slide child, adding controls and a footer (if applicable)
 * 
 * @param {string} containerClassNames enables to parent component to place addiotnal classnames on the container
 * @param {object} controlButtons the buttons that should be displayed for this particular slide eg Next Slide
 * @param {string} footer the content for a footer if required for the slide, expects either an image, text or both
 * @param {ReactElement} children the slide that this wrapper wraps
 * 
 * @returns {ReactElement} A div containing the wrapper content and any children
 */
export default function SlideLayout({ containerClassNames="", controlButtons, footer, children }) {

    return (
        <div className={`intro-slide-container ${containerClassNames}`}>
            <div className="intro-slide">
                {children}
                <Controls 
                    buttons={controlButtons} 
                    id="slide-controls"
                />
                {footer && 
                    <Footer 
                        image={footer.image} 
                        items={footer.items} 
                    />
                }
            </div>
        </div>
    )
}
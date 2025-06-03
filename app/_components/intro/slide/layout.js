'use client';
import Controls from './controls/page';
import Footer from './footer/page';

/**
 * @description Renders a wrapper for a slide child, adding controls and a footer (if applicable)
 * 
 * @param {Object} props - The component props
 * @param {string} [props.containerClassNames=""] - Additional class names to apply to the container
 * @param {Array<{key: string, label: string, onClick: () => void}>} props.controlButtons - Control buttons configuration
 * @param {Object} [props.footer] - Optional footer configuration
 * @param {Object} [props.footer.image] - Image configuration for the footer
 * @param {Array<{key: string, label: string, url?: string}>} [props.footer.items] - Footer items configuration
 * @param {import('react').ReactNode} props.children - The slide content to wrap
 * 
 * @returns {import('react').ReactElement} A div containing the wrapper content and any children
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
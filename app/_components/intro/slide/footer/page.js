import Image from 'next/image';
import { robotoMonoFont } from '@/app/assets/fonts';

/**
 * @description Renders either an image, or text lines, or both, in the form of a footer for use on a slide
 * 
 * @param {Object} props - The component props
 * @param {Object} [props.image] - Image configuration object
 * @param {string} props.image.src - Source URL for the image
 * @param {Array<{key: string, label: string, url?: string}>} [props.items=[]] - Array of footer items to display
 * @param {string} props.items[].key - Unique identifier for the item
 * @param {string} props.items[].label - Display text for the item
 * @param {string} [props.items[].url] - Optional URL for clickable items
 * 
 * @returns {import('react').ReactElement} A div containing the footer content with optional image and items list
 */
 const Footer = ({ image, items=[] }) => {
    return (
        <div className="slide-footer-container" style={{ border : "1px solid red" }}>
            <div className="slide-footer" style={{ border : "1px solid blue" }}>
                {image &&
                    <div className="slide-footer-visual" style={{ border : "1px solid green" }}>
                        <Image 
                            className="image" 
                            src={image.src} 
                            alt="profile-photo" 
                            width={100}
                            height={100}
                            style={{
                                width: '85%',
                                height: 'auto'
                            }}
                        />
                    </div>
                }
                <ul className="slide-footer-items-list">
                    {items.map(item => 
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
    )
}
  
export default Footer;
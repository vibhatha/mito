import Link from 'next/link';
import { MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import TextButton from '../TextButton/TextButton';
import ctaButtons from './CTAButtons.module.css'
import { classNames } from '../../utils/classNames';

const JUPYTERLITE_MITO_LINK = 'https://mito-ds.github.io/mitolite/lab?path=mito.ipynb';

const CTAButtons = (props: {
    variant: 'download' | 'contact' | 'try jupyterlite' | 'scroll-to-install' | 'book a demo',
    align: 'left' | 'center',
    displaySecondaryCTA?: boolean
    secondaryCTA?: 'pro' | 'learn more',
}): JSX.Element => {

    const displaySecondaryCTA = props.displaySecondaryCTA ?? true; 
    const secondaryCTA = props.secondaryCTA ?? 'pro';
    return (
        <div className={classNames(
            ctaButtons.cta_buttons_container, 
            {[ctaButtons.center] : props.align === 'center'},
        )}> 
            {props.variant === 'download' && 
                <TextButton 
                    text='Install Mito'
                    href={MITO_INSTALLATION_DOCS_LINK}
                />
            }
            {props.variant === 'scroll-to-install' && 
                <TextButton 
                    text='Try Mito now'
                    href='#installation'
                    openInNewTab={false}
                />
            }
            {props.variant === 'try jupyterlite' && 
                <TextButton 
                    text='Try Mito'
                    href={JUPYTERLITE_MITO_LINK}
                />
            }
            {props.variant === 'contact' && 
                <TextButton 
                    text='Contact the Mito Team'
                    href="mailto:founders@sagacollab.com"
                />
            }
            {props.variant === 'book a demo' && 
                <>
                    <div className='only-on-desktop'>
                        <TextButton 
                            text='Book an Enterprise Demo'
                            href="mailto:founders@sagacollab.com"
                            variant='secondary'
                        />
                    </div>
                    <div className='only-on-mobile'>
                        <TextButton 
                            text='Book a Demo'
                            href="mailto:founders@sagacollab.com"
                            variant='secondary'
                        />
                    </div>
                </>
                
            }
            
            {displaySecondaryCTA && secondaryCTA === 'pro' && 
                <div className={ctaButtons.cta_subbutton}>
                    <Link href='/plans'>
                        <a className={ctaButtons.pro_cta_text}>
                            or see Pro plans →
                        </a>
                    </Link>
                </div>
            }
            {displaySecondaryCTA && secondaryCTA === 'learn more' && 
                <div className={ctaButtons.cta_subbutton}>
                    <Link href='/'>
                        <a className={ctaButtons.pro_cta_text}>
                            or learn more →
                        </a>
                    </Link>
                </div>
            }
        </div>
    )
}

export default CTAButtons;
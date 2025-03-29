import { Roboto, Roboto_Mono } from "next/font/google"

export const robotoFont = Roboto({
    subsets:["latin"],
    weight:"400",
});

export const robotoBoldFont = Roboto({
    subsets:["latin"],
    weight:"600",
});

export const robotoMonoFont = Roboto_Mono({
    subsets: ['latin'],
    variable: '--font-roboto-mono',
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    display: 'swap',
});
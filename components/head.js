import Head from 'next/head'

export default function HeadObject({children}) {
    const title = "8 Minutes";
    const description = "It only takes 8 minutes with a friend to feel less alone. Our platform pairs strangers together for short, impactful conversations. Connect with someone new, share experiences, and foster a sense of belonging—all in just eight minutes.";
    const searchBarColor = "#ffffff"; 
    const keywords = "8 minutes, 8minutes, eight minutes, eight, minutes, free chat, ";
    const author = "Sahiti Dasari";
    const url = "http://localhost:3000";
    //const image = "/ogimage.png"; //OpenGraph image
    return (
        <Head>
            <meta charSet="utf-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />
            <meta name="theme-color" content={searchBarColor} media="(prefers-color-scheme: light)" />
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>😋</text></svg>" />
            {/* <meta name="theme-color" content={darkSearchBarColor} media="(prefers-color-scheme: dark)" /> */}
            {url ? <meta property="og:url" content={url} /> : ''}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {/* <meta property="og:image" content={image} /> */}
            {/* Add analytics here */}
            {children}
        </Head>
    )
}

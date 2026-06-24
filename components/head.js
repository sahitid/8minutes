import Head from 'next/head'

export default function HeadObject({children}) {
    const title = "8 Minutes";
    const description = "It only takes 8 minutes with a friend to feel less alone. We pair strangers together for short, honest conversations. Connect with someone new, share what's on your mind, and feel a little more at home in the world, all in just eight minutes.";
    const searchBarColor = "#FBF8F3"; 
    const keywords = "8 minutes, 8minutes, eight minutes, eight, minutes, free chat, ";
    const author = "Sahiti Dasari";
    // Social cards (OpenGraph/Twitter) need an ABSOLUTE url. Defaults to the
    // production domain; override with NEXT_PUBLIC_SITE_URL for other deploys.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://8minutes.vercel.app").replace(/\/$/, "");
    const url = siteUrl;
    const image = `${siteUrl}/api/og`;
    const imageAlt = "8 Minutes — it only takes 8 minutes to feel less alone.";
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
            <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>❽</text></svg>" />
            {/* <meta name="theme-color" content={darkSearchBarColor} media="(prefers-color-scheme: dark)" /> */}

            {/* OpenGraph */}
            <meta property="og:site_name" content={title} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:secure_url" content={image} />
            <meta property="og:image:type" content="image/png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={imageAlt} />

            {/* Twitter / X large photo card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:image:alt" content={imageAlt} />

            {/* Add analytics here */}
            {children}
        </Head>
    )
}

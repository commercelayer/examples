export const serveHtml = (pageBody: string) => {
  const title = "Commerce Layer Demo Slackbot";
  const description = "A slackbot for Commerce Layer orders and returns summaries.";
  const url = process.env.APP_URL;
  const keywords =
    "Commerce Layer, Commerce Layer API, Commerce Layer Slackbot, Slackbot, Slack API, Slack Bolt, Ecommerce Slackbot, Ecommerce API";
  const twitterHandle = "@commercelayer";
  const ogImage =
    "https://raw.githubusercontent.com/commercelayer/examples/main/solutions/commercelayer-slackbot/static/app-details.png";

  return `
    <html>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <title>${title}</title>
          <meta name="description" content="${description}" />
          <meta name="keywords" content="${keywords}" />
          <meta property="og:url" content="${url}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:creator" content="${twitterHandle}" />
          <meta name="twitter:site" content="${twitterHandle}" />
          <meta name="twitter:image" content="${ogImage}" />
          <meta name="twitter:image:alt" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta property="og:image" content="${ogImage}" />
          <meta property="og:image:width" content="900" />
          <meta property="og:image:height" content="600" />
          <link href="https://data.commercelayer.app/assets/images/favicons/favicon-32x32.png" rel="shortcut icon">
          <link rel="preload" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;display=swap" as="style">
          <link rel="preload" href="https://data.commercelayer.app/assets/logos/glyph/black/commercelayer_glyph_black.svg" as="image" type="image/svg+xml">
          <style>
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;display=swap');
          body {
            font-family: 'Manrope', sans-serif;
            overflow: auto;
            width: 25%;
            height: 30%;
            padding: 4em;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin: auto;
            max-width: 100%;
            max-height: 100%;
            border: 3px solid #666EFF;
            text-align: center;
          }
          a {
            color: #000;
          }
          @media (max-width: 768px) {
            body {
              padding: 10em 1em;
              width: 80%;
              height: 45%;
            }
          }
          </style>
        </head>
        <body>
            ${pageBody}
        </body>
    </html>`;
};

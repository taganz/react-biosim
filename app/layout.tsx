import JotaiProvider from "@/components/providers/JotaiProvider";
import "@/styles/globals.scss";
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata = {
  title: "react-biosim",
  description: "Evolution simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const cKeyString : string = process.env.REACT_APP_CLARITY_ID !== undefined ? process.env.REACT_APP_CLARITY_ID : "";
  
  const clarityKey : string =  `
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
   })(window, document, "clarity", "script","`.concat(cKeyString, "\");");
 
   //console.log("clarityKey: ", clarityKey);

  return (
    <html lang="en">
      { /* Microsoft Clarity tag */ }
      <Script
        id="clarity2"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: clarityKey,
        }}
      />
      <body>
        <JotaiProvider>{children}</JotaiProvider>
      </body>
      { /* Google Analytics tag */ }
      <GoogleAnalytics  gaId = {process.env.REACT_APP_GOOGLE_GA_ID !== undefined ? process.env.REACT_APP_GOOGLE_GA_ID : ""}  />
    </html>
  );
}


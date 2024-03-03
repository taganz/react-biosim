import JotaiProvider from "@/components/providers/JotaiProvider";
import "@/styles/globals.scss";
import Script from 'next/script'


export const metadata = {
  title: "react-biosim",
  description: "Evolution simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script
        id="clarity2"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "lau5rlq9k8");`,
        }}
      />
      <body>
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}


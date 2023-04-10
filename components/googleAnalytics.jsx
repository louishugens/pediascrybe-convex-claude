'use client'
import Script from 'next/script'
import { GoogleAnalytics } from "nextjs-google-analytics";

const GA = () => {
  return (
    <>
      <GoogleAnalytics />
      {/* <Script type="text/javascript">
        `(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "gllbj0lyj3");`
      </Script> */}
    </>
  )
}

export default GA
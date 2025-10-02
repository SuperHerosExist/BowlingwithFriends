import React, { useEffect, useRef } from 'react';

export default function AdBanner({ slot = '1234567890', format = 'auto', responsive = true }) {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      // Push ad to AdSense
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className="ad-banner-container" style={{ textAlign: 'center', margin: '20px 0' }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9558998933851822"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      ></ins>
    </div>
  );
}

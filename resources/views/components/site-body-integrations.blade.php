@if(!empty($siteSettings['meta_pixel_id']))
    <noscript>
        <img
            height="1"
            width="1"
            style="display:none"
            src="https://www.facebook.com/tr?id={{ rawurlencode($siteSettings['meta_pixel_id']) }}&ev=PageView&noscript=1"
            alt=""
        >
    </noscript>
@endif

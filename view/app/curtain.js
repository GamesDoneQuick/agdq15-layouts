(function() {
    var BANNER_URLS = [
        "/view/agdq15-layouts/img/banners/0.png",
        "/view/agdq15-layouts/img/banners/1.png",
        "/view/agdq15-layouts/img/banners/2.png",
        "/view/agdq15-layouts/img/banners/3.png",
        "/view/agdq15-layouts/img/banners/4.png",
        "/view/agdq15-layouts/img/banners/5.png"
    ];

    var $banner = $('.banner');
    var $nextBanner = $('.nextBanner');

    var bannerTl = new TimelineMax({ repeat: -1 });
    BANNER_URLS.forEach(function(bannerUrl) {
        bannerTl.to($nextBanner, 1, {
            onStart: function() {
                $nextBanner.css('background-image', 'url("'+bannerUrl+'")');
            },
            opacity: 1,
            ease: Power0.linear,
            onComplete: function() {
                $banner.css('background-image', 'url("'+bannerUrl+'")');
                $nextBanner.css('opacity', 0);
                $nextBanner.css('background-image', 'none');
            }
        }, '+=10');
    });
})();
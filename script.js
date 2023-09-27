$(document).ready(function () {

    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
    }

    const setAutoLocation = function () {
        var date = new Date();
        date.setDate(date.getDate() + 1);
        var expires = ";expires=" + date.toUTCString();
        var locationTimeout = setTimeout(useIpInfo, 10000); // Set a timeout to use ipinfo.io after 8 seconds
        // Trying to get the location using the Geolocation API
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                clearTimeout(locationTimeout); // Clear the timeout if the location is obtained successfully
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                processLocation(userLat, userLng);
            }, function (error) {
                clearTimeout(locationTimeout); // Clear the timeout if there was an error
                useIpInfo(); // Use ipinfo.io as a fallback
            });
        } else {
            useIpInfo(); // Use ipinfo.io if Geolocation API is not available
        }

        function useIpInfo() {
            $.get("https://ipinfo.io", function (response) {
                var loc = response.loc.split(','); // response.loc will be in "latitude,longitude" format
                var userLat = parseFloat(loc[0]);
                var userLng = parseFloat(loc[1]);
                processLocation(userLat, userLng);
            }, "jsonp");
        }

        function processLocation(userLat, userLng) {
            var tempDiv = $("<div>");
            tempDiv.load("/locations #addresses", function () {
                var locations = [];
                tempDiv.find('.geo-location').each(function () {
                    var location = {
                        lat: parseFloat($(this).find('.geo-lat').text()),
                        lng: parseFloat($(this).find('.geo-long').text()),
                        address: $(this).find('.geo-address').text(),
                        slug: $(this).find('.geo-slug').text(),
                        location: $(this).find('.geo-location').text()
                    };
                    locations.push(location);
                });

                var closestLocation = null;
                var shortestDistance = Number.MAX_VALUE;

                locations.forEach(function (location) {
                    var distance = Math.sqrt(Math.pow(location.lat - userLat, 2) + Math.pow(location.lng - userLng, 2));
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        closestLocation = location;
                    }
                });

                document.cookie = "restaurantLocation=" + closestLocation.location + expires + "; path=/";
                document.cookie = "restaurantSlug=/locations/" + closestLocation.slug + expires + "; path=/";
                $('#nav-location-name').text(closestLocation.location);
            });
        }
    };

    const setManualLocationListener = function () {
        $('.geo-select').on('click', function () {
            $(this).addClass('load');
            var location = $(this).attr('data-location');
            var slug = $(this).attr('data-slug');

            // Set the expiration date for the cookies to 7 days in the future
            var date = new Date();
            date.setDate(date.getDate() + 1);
            var expires = ";expires=" + date.toUTCString();

            // Set the cookies
            document.cookie = "restaurantLocation=" + location + expires + "; path=/";
            document.cookie = "restaurantSlug=/locations/" + slug + expires + "; path=/";

            locationSetup(this);
        });
    }

    const locationSetup = function (triggerEl) {
        $('#nav-location-name').text(getCookie("restaurantLocation"));
        const restaurantSlug = getCookie("restaurantSlug");
        if (triggerEl) {
            if (window.currentLocation !== undefined) {
                if (restaurantSlug != window.currentLocation) {
                    $('.geo-change-id').each(function () {
                        if ($(this).attr('href') == restaurantSlug) {
                            const siblingGeoChangeTarget = $(this).siblings('.geo-change-target');
                            window.location.href = siblingGeoChangeTarget.attr('href');
                            return
                        };
                    });
                };
            };
        };
        $('<div />').load(`${restaurantSlug} #nav-location-tile`, function () {
            const newNavSelectedLocation = $(this).find('.nav_selected-location');
            $('.nav .nav_selected-location').replaceWith(newNavSelectedLocation);
            $('.nav .nav_location-list').removeClass('visible');
            $('.nav .nav_selected-location').addClass('visible');
            if (triggerEl) {
                $(triggerEl).removeClass('load');
                $('.nav #nav-loc-dropdown').addClass('visible');
                window.mouseEntered = false;
            };
        });
    }

    setManualLocationListener();
    if (!getCookie("restaurantLocation") || !getCookie("restaurantSlug") || getCookie("restaurantSlug") == 'undefined' || getCookie("restaurantLocation") == 'undefined') {
        setAutoLocation();
    } else {
        locationSetup();
    }
    $(document).on('click', '#select-location', function () {
        $('.nav .nav_location-list').addClass('visible');
        $('.nav .nav_selected-location').removeClass('visible');
    });

});

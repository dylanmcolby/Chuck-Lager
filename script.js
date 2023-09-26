$(document).ready(function () {

    const setLocation = function () {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
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
                    const userLocation = closestLocation.slug;
                    document.cookie = "restaurantLocation=" + userLocation + "; path=/";
                });
            });
        }
    };
    setLocation();

});

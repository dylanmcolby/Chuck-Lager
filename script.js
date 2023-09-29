document.addEventListener('DOMContentLoaded', function () {

    //FOR LATER CALCS
    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    function haversineDistance(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the Earth in km
        var dLat = toRadians(lat2 - lat1);
        var dLon = toRadians(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = R * c; // Distance in km

        // Convert distance from km to miles
        distance = distance * 0.621371;
        return distance;
    }

    //
    //NAV SETUP
    //
    function calcNavWidth() {
        // 1. Calculate availableWidth
        var availableWidth = $('#nav-links-main').outerWidth() - $('#navmore-hover').outerWidth() - 32;


        // 2. Calculate linksWidth
        var linksWidth = 0;
        $('#nav-links-main > .nav_link').each(function () {
            linksWidth += $(this).outerWidth();
        });
        // 3. Calculate extraLinkWidth
        var extraLink = $('#nav-dropdown > .nav_link:first');

        if (linksWidth + 96 > availableWidth && linksWidth < availableWidth) {
            return
        }
        // 4. Move extraLink to #nav-links-main if condition is met
        else if (linksWidth + 96 <= availableWidth) {
            extraLink.insertBefore('#navmore-hover');
            calcNavWidth(); // repeat function
        }
        // 5. Move last .nav_link inside #nav-links-main to #nav-dropdown if condition is met
        else if (linksWidth > availableWidth) {
            var lastNavLink = $('#nav-links-main > .nav_link:last');
            lastNavLink.prependTo('#nav-dropdown');
            calcNavWidth(); // repeat function
        }

        if ($('.nav_dropdown .nav_link').length > 0) {
            $('.nav_hidden').css('display', 'block');
        } else {
            $('.nav_hidden').css('display', 'none');
        }
    }

    let resizeTimer;
    $(window).on('resize load', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            calcNavWidth();
        }, 100);
    });

    $('#navmore-hover').on('mouseenter', function (e) {
        $('#nav-dropdown').addClass('visible');
    });

    $('#navmore-hover').on('mouseleave', function (e) {
        $('#nav-dropdown').removeClass('visible');
    });
    // Handle click events
    $('#navmore').on('tap', function (e) {
        e.preventDefault();
        $('#nav-dropdown').toggleClass('visible');
    });

    window.mouseEntered = false;

    $('#nav-locations').on('mouseenter', function (e) {
        mouseEntered = true;
        $('#nav-loc-dropdown').addClass('visible');
    });
    $('#nav-locations').on('mouseleave', function (e) {
        if (mouseEntered) {
            $('#nav-loc-dropdown').removeClass('visible');
            mouseEntered = false;
        }
    });

    $('#nav-location-link').on('tap', function (e) {
        e.stopPropagation();
        setTimeout(function () { $('#nav-loc-dropdown').addClass('visible') }, 1);
    });

    const $locDropdown = $('#nav-loc-dropdown');
    $(document).on('click', function (event) {
        if (!$(event.target).closest($locDropdown).length) {
            $locDropdown.removeClass('visible');
        }
    });

    // Handle scroll events
    $(window).on('scroll', function () {
        const navDropdown = $('#nav-dropdown');
        const navLocations = $('#nav-loc-dropdown');
        navDropdown.removeClass('visible');
        navLocations.removeClass('visible');

    });


    //
    //LOCATION SETUP
    //

    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
    }

    var secureFlag = "; Secure"; // Only send cookie over HTTPS
    var sameSiteFlag = "; SameSite=Strict"; // Cookie will only be sent in a first-party context


    const requestExactLocation = function (triggerEl) {
        // Trying to get the location using the Geolocation API
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var date = new Date();
                date.setDate(date.getDate() + 1);
                var expires = ";expires=" + date.toUTCString();
                document.cookie = "locationProximity=exact" + expires + "; path=/" + secureFlag + sameSiteFlag;
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                if (triggerEl) { $(triggerEl).removeClass('load'); };
                processLocation(userLat, userLng);
            }, function (error) {
                alert("Sorry, we weren't able to find you. Please set your location manually");
                if (triggerEl) { $(triggerEl).removeClass('load'); };
            });
        } else {
            alert("Sorry, we weren't able to find you. Please set your location manually");
            if (triggerEl) { $(triggerEl).removeClass('load'); };
        }
    }
    //AUTO LOCATION
    const setAutoLocation = function () {
        $.get("https://ipinfo.io", function (response) {
            var loc = response.loc.split(','); // response.loc will be in "latitude,longitude" format
            var userLat = parseFloat(loc[0]);
            var userLng = parseFloat(loc[1]);
            processLocation(userLat, userLng);
            var date = new Date();
            date.setDate(date.getDate() + 1);
            var expires = ";expires=" + date.toUTCString();
            document.cookie = "locationProximity=approx" + expires + "; path=/" + secureFlag + sameSiteFlag;
        }, "jsonp");
    }
    //FIND CLOSEST LOCATION AND SET LOCATION COOKIE
    const processLocation = function (userLat, userLng) {
        var locations = [];
        $('#geo-addresses .geo-location').each(function () {
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
        var date = new Date();
        date.setDate(date.getDate() + 1);
        var expires = ";expires=" + date.toUTCString();
        document.cookie = "restaurantLocation=" + closestLocation.location + expires + "; path=/" + secureFlag + sameSiteFlag;
        document.cookie = "restaurantSlug=/locations/" + closestLocation.slug + expires + "; path=/" + secureFlag + sameSiteFlag;
        document.cookie = "userLat=" + userLat + expires + "; path=/" + secureFlag + sameSiteFlag;
        document.cookie = "userLng=" + userLng + expires + "; path=/" + secureFlag + sameSiteFlag;

        locationSetup();
    };
    //FOR BUTTONS THAT SELECT INDIVIDUAL LOCATIONS
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
            document.cookie = "restaurantLocation=" + location + expires + "; path=/" + secureFlag + sameSiteFlag;
            document.cookie = "restaurantSlug=/locations/" + slug + expires + "; path=/" + secureFlag + sameSiteFlag;
            document.cookie = "locationProximity=manual" + expires + "; path=/" + secureFlag + sameSiteFlag;
            locationSetup(this);
        });
    }

    const sortLocationWidget = function (userLat, userLng) {
        // Create an array to store the elements and their distances
        var locationArray = [];

        // Your code to handle the geo-distance elements
        $('.geo-distance').each(function () {
            var $this = $(this);
            var lat = $this.data('lat');
            var lon = $this.data('lon');
            if (lat && lon) {
                var distance = haversineDistance(userLat, userLng, lat, lon);
                $this.text(distance.toFixed(1) + ' miles away');
                // Storing the distance and element reference in the array
                locationArray.push({ distance: distance, element: $this.closest('.nav_select-location') });
            }
        });

        // Sorting the array based on the distance
        locationArray.sort(function (a, b) {
            return a.distance - b.distance;
        });

        // Appending the sorted elements back to the .nav_select-locations container
        var container = $('.nav_select-locations');
        locationArray.forEach(function (locationObj) {
            container.append(locationObj.element);
        });
    }
    const locationSetup = function (triggerEl) {
        $('#nav-location-name').text(getCookie("restaurantLocation"));
        const restaurantSlug = getCookie("restaurantSlug");
        let shouldExit = false;
        //if user manually set location, then we can change current window if it is location-oriented
        if (triggerEl) {
            if (window.currentLocation !== undefined) {
                if (restaurantSlug != window.currentLocation) {
                    $('.geo-change-id').each(function () {
                        if ($(this).attr('href') == restaurantSlug) {
                            const siblingGeoChangeTarget = $(this).siblings('.geo-change-target');
                            window.location.href = siblingGeoChangeTarget.attr('href');
                            shouldExit = true;
                        };
                    });
                };
            };
        };
        //continue to update all links and states if window does not need to be changed
        if (shouldExit == false) {
            $('<div />').load(`${restaurantSlug} #nav-location-tile`, function () {
                //set navigation buttons to be location-specific
                const geoMenuHref = $(this).find('[data-geo-menu]').attr('href');
                if (geoMenuHref != "#" && geoMenuHref != null && geoMenuHref != "") { $('.nav [data-geo-menu]').attr('href', geoMenuHref); } else { $('.nav [data-geo-menu]').attr('href', '/locations'); }
                const geoReserveHref = $(this).find('[data-geo-reserve]').attr('href');
                if (geoReserveHref != "#" && geoMenuHref != null && geoMenuHref != "") { $('.nav [data-geo-reserve]').attr('href', geoReserveHref); } else { $('.nav [data-geo-reserve]').attr('href', '/locations'); }
                const geoOrderHref = $(this).find('[data-geo-order]').attr('href');
                if (geoOrderHref != "#" && geoMenuHref != null && geoMenuHref != "") { $('.nav [data-geo-order]').attr('href', geoOrderHref); } else { $('.nav [data-geo-order]').attr('href', '/locations'); }
                const newNavSelectedLocation = $(this).find('.nav_selected-location');
                $('.nav .nav_selected-location').replaceWith(newNavSelectedLocation);
                $('.nav .nav_location-list').removeClass('visible');
                $('.nav .nav_selected-location').addClass('visible');
                if (triggerEl) {
                    $(triggerEl).removeClass('load');
                    $('.nav #nav-loc-dropdown').addClass('visible');
                    window.mouseEntered = false;
                };
                // Accessing cookies userLat and userLng
                var userLat = parseFloat(getCookie('userLat'));
                var userLng = parseFloat(getCookie('userLng'));
                if (!isNaN(userLat) && !isNaN(userLng)) {
                    sortLocationWidget(userLat, userLng)
                }

            });

        }
    }
    //CHECK IF LOCATION COOKIE EXISTS, IF NOT, SET IT
    setManualLocationListener();
    if (!getCookie("restaurantLocation") || !getCookie("restaurantSlug") || getCookie("restaurantSlug") == 'undefined' || getCookie("restaurantLocation") == 'undefined') {
        setAutoLocation();
    } else {
        locationSetup();
    }
    //TO LET USER NAVIGATE TO PANEL TO SELECT LOCATION
    $(document).on('click', '.select-location-btn', function () {
        $('.nav .nav_location-list').addClass('visible');
        $('.nav .nav_selected-location').removeClass('visible');
        setTimeout(function () { $('#nav-loc-dropdown').addClass('visible') }, 1);
        window.mouseEntered = false;
    });

    //to let user choose exact location
    $('.set-exact-btn').on('click', function () {
        $(this).addClass('load');
        requestExactLocation(this);
    });

    //
    //to let user search location widget
    //
    $('#geo-search-input').on('keypress', function (e) {
        if (e.which == 13) { // Check if the enter key was pressed
            e.preventDefault();
            var address = $(this).val();
            // Making request to the Google Maps API
            $.ajax({
                url: 'https://maps.googleapis.com/maps/api/geocode/json',
                data: { 'address': address },
                success: function (data) {
                    if (data.results.length > 0) {
                        var location = data.results[0].geometry.location;
                        // Calling the sortLocationWidget function with the returned latitude and longitude
                        sortLocationWidget(location.lat, location.lng);
                    } else {
                        alert('Location not found');
                    }
                },
                error: function () {
                    alert('An error occurred');
                }
            });
        }
    });

    //
    //RICH TEXT MENU SETUP 
    //

    $('.menu_items-rich-text').each(function () {
        // Replace [glutenfree] with its corresponding image
        var glutenFreeHTML = '<img alt="Gluten Free" style="display:inline-block;margin-top:-.25rem" class="icon-1x1-xsmall" src="https://uploads-ssl.webflow.com/6501f8d7518f57ff9967db13/65148360a9e331145818522c_glutenfree.svg">';
        $(this).html($(this).html().replace(/\[glutenfree\]/g, glutenFreeHTML));
        $(this).html($(this).html().replace(/\[GlutenFree\]/g, glutenFreeHTML));

        // Replace [spicy] with its corresponding image
        var spicyHTML = '<img alt="Spicy" style="display:inline-block;margin-top:-.25rem" class="icon-1x1-xsmall" src="https://uploads-ssl.webflow.com/6501f8d7518f57ff9967db13/651483615ff4e3a188eb7155_hot.svg">';
        $(this).html($(this).html().replace(/\[spicy\]/g, spicyHTML));
        $(this).html($(this).html().replace(/\[Spicy\]/g, spicyHTML));

        // Replace [regional] with its corresponding image
        var regionalHTML = '<img alt="Regional" style="display:inline-block;margin-top:-.25rem" class="icon-1x1-xsmall" src="https://uploads-ssl.webflow.com/6501f8d7518f57ff9967db13/651484938f6dafebbddc75f9_local.svg">';
        $(this).html($(this).html().replace(/\[regional\]/g, regionalHTML));
        $(this).html($(this).html().replace(/\[Regional\]/g, regionalHTML));
    });
    let checkExist = setInterval(function () {
        if (typeof fsAttributes !== 'undefined') {
            clearInterval(checkExist); // stop the interval
            if (fsAttributes && fsAttributes.cmsnest && fsAttributes.cmsnest.loading) {
                fsAttributes.cmsnest.loading.then(function (result) {
                    $('.menu_categories').each(function (index) {
                        const itemsCount = $(this).children().length;

                        if (itemsCount < 4) {
                            $(this).addClass('two-column');
                        } else {
                            $(this).removeClass('two-column');
                        }
                    });
                }).catch(function (error) {
                    console.log('Promise rejected with error:', error);
                });
            } else {
                console.log('fsAttributes or its properties do not exist.');
            }
        }
    }, 100); // check every 100ms

    // Stop checking after 10 seconds
    setTimeout(function () {
        clearInterval(checkExist);
    }, 10000);


    //HIDE HOURS THAT AREN'T TODAY
    // Get the current day of the week
    var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var currentDay = days[new Date().getDay()];

    // Select all elements with a data-display-* attribute
    $('[data-display]').each(function () {
        var $this = $(this);

        // Get the day from the data-display attribute
        var displayDay = $this.attr('data-display').toLowerCase();

        // If the day does not match the current day, hide the element
        if (displayDay !== currentDay) {
            $this.hide();
        } else {
            $this.show();
        }
    });

});

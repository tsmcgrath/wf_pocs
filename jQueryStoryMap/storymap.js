    (function ($) {
    'use strict';

    // Add geojson files as js scripts. This allows it to work locally as well as when deployed to GH pages
    // The file is a geojson file with a variable added at the beginning. Variable name is same as file name but with underscore


    $.fn.storymap = function(options) {

        var defaults = {
            selector: '[data-place]',
            breakpointPos: '33.333%',
            createMap: function () {
                // create a map in the "map" div, set the view to the WHW route center and a good overall zoom
                var map = L.map('map').setView([56.4048, -4.6424], 9);

                // add an OpenStreetMap tile layer
                L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                // Colors from: https://colorbrewer2.org/#type=qualitative&scheme=Dark2&n=8
                // add the WHW route lines
                // add the WHW route lines
                // Add day 1
                var day1style = {
                    "color": "#7fc97f",
                    "weight": 5
                }
                // loading GeoJSON file - Here my .geojson file resides in the data sub-folder
    
                // add GeoJSON layer to the map once the file is loaded
                var day1layer = L.geoJSON(milngavie_drymen, {
                        style: day1style
                    }).addTo(map);
                //map.fitBounds(day1layer.getBounds());

                // Add day 2
                var day2style = {
                    "color": "#d95f02",
                    "weight": 5
                }
                var day2layer = L.geoJSON(drymen_rowardennan, {
                    style: day2style
                }).addTo(map);
                //map.fitBounds(day2layer.getBounds());
                
                // Add day 3
                var day3style = {
                    "color": "#7570b3",
                    "weight": 5
                }
                // loading GeoJSON file - Here my .geojson file resides in the data sub-folder
                var day3layer = L.geoJSON(rowardennan_inverarnan, {
                    style: day3style
                }).addTo(map);
                //map.fitBounds(day3layer.getBounds());
                }
        };

        var settings = $.extend(defaults, options);


        if (typeof(L) === 'undefined') {
            throw new Error('Storymap requires Laeaflet');
        }
        if (typeof(_) === 'undefined') {
            throw new Error('Storymap requires underscore.js');
        }

        function getDistanceToTop(elem, top) {
            var docViewTop = $(window).scrollTop();

            var elemTop = $(elem).offset().top;

            var dist = elemTop - docViewTop;

            var d1 = top - dist;

            if (d1 < 0) {
                return $(window).height();
            }
            return d1;

        }

        function highlightTopPara(paragraphs, top) {

            var distances = _.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return {el: $(element), distance: dist};
            });

            var closest = _.min(distances, function (dist) {
                return dist.distance;
            });

            _.each(paragraphs, function (element) {
                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }
            });

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }

        function watchHighlight(element, searchfor, top) {
            var paragraphs = element.find(searchfor);
            highlightTopPara(paragraphs, top);
            $(window).scroll(function () {
                highlightTopPara(paragraphs, top);
            });
        }

        var makeStoryMap = function (element, markers) {

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();

            var searchfor = settings.selector;

            var paragraphs = element.find(searchfor);

            paragraphs.on('viewing', function () {
                $(this).addClass('viewing');
            });

            paragraphs.on('notviewing', function () {
                $(this).removeClass('viewing');
            });

            watchHighlight(element, searchfor, top);

            var map = settings.createMap();

            var initPoint = map.getCenter();
            var initZoom = map.getZoom();

            var fg = L.featureGroup().addTo(map);

            function showMapView(key) {

                fg.clearLayers();
                if (key === 'overview') {
                    map.setView(initPoint, initZoom, true);
                } else if (markers[key]) {
                    var marker = markers[key];
                    var layer = marker.layer;
                    if(typeof layer !== 'undefined'){
                      fg.addLayer(layer);
                    };
                    // turn off the marker label
                    // fg.addLayer(L.marker([marker.lat, marker.lon]));

                    map.setView([marker.lat, marker.lon], marker.zoom, 1);

                }

            }

            paragraphs.on('viewing', function () {
                showMapView($(this).data('place'));
            });
        };

        makeStoryMap(this, settings.markers);

        return this;
    }

}(jQuery));

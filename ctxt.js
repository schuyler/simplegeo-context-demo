var client = new simplegeo.ContextClient('wdnCU4wKjvb3BYsW9UDGAdWzFDvfN9sW');

var po = org.polymaps;
var map = po.map()
    .container(document.getElementById("map").appendChild(po.svg("svg")))
    .add(po.interact())
    .add(po.hash());

map.add(po.image()
    .url(po.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""])));

var geojson = po.geoJson();
map.add(geojson);
map.add(po.compass().pan("none"));

geojson.on("load", function(e) {
    if (e.features.length) {
        var f = e.features[0];
        f.element.setAttribute("class", "boundary");
    }
});

// don't treat a down-drag-up as a click.
var mousePosition;
$("#map").mousedown(function(e) { mousePosition = map.mouse(e); });
$("#map").mouseup(function(e) {
    var position = map.mouse(e);
    if (mousePosition.x - position.x + mousePosition.y - position.y > 5) return;
    var coord = map.pointLocation(map.mouse(e));
    /* deal with wraparound */
    while (coord.lon > 180.0) coord.lon -= 360.0;
    while (coord.lon < -180.0) coord.lon += 360.0;
    // console.log("("+coord.lat+","+coord.lon+")");
    addInfoItem("<div style=\"text-align:center\"><blink>... Loading ...</blink></div>");
    client.getContext(coord.lat, coord.lon, function(err, data) {
        if (err) 
            (typeof console == "undefined") ? alert(e) : console.error(e);
        else {
            geojson.features([]);
            data.features.sort(function(a, b) {
                return approximateArea(a.bounds) - approximateArea(b.bounds);
            });
            listFeatures(data);
        }
    });
});

function approximateArea(bounds) {
    var delta = bounds[3] - bounds[1];
    return (bounds[2]-bounds[0])*Math.cos(delta*Math.PI/180.0)*delta;
}

function getWeather(weather) {
    var temp = "";
    if (!weather) return;
    if (weather.temperature) {
        var temp_f = weather.temperature.substr(0, weather.temperature.length-1);
        var temp_c = Math.round((temp_f - 32) / 9.0 * 5.0);
        temp = temp_c + "&deg;C (" + temp_f + "&deg;F)";
    }
    return (weather.conditions ? weather.conditions + " " : "") + temp;
}

function addInfoItem(innerHtml) {
    var li = document.createElement("li");
    li.innerHTML = innerHtml;
    $("#infolist").append(li);
}

function listFeatures(result) {
    $("#infolist").empty();

    var extent = map.extent();
    var bounds = [extent[0].lon, extent[0].lat, extent[1].lon, extent[1].lat];

    var weather = getWeather(result.weather);
    if (weather)
        addInfoItem("<div class=\"feature_name temperature\">" + weather + "</div>" +
                    "<div class=\"feature_type temperature\">Weather Conditions</div>");

    $.each(result.features, function(i, f) {
        var li = document.createElement("li");
        if (approximateArea(f.bounds) < approximateArea(bounds)) {
            li.className = "feature_clickable";
            anchor.addEventListener("click", function(e) {loadFeature(anchor,f)}, false);
        }
        var anchor = document.createElement("a");
        anchor.innerHTML = "<div class=\"feature_name\">" + f.name + "</div>"
        $.each(f.classifiers, function(j, cl) {
            var cat = cl.category;
            if (cl.subcategory) cat += " &raquo; " + cl.subcategory;
            anchor.innerHTML += "<div class=\"feature_type\">" + cat + "</div>";
        });
        li.appendChild(anchor);
        $("#infolist").append(li);
    });
}

function loadFeature(anchor, feature) {
    $(".feature_clicked").each(function (i, e) {e.className = "feature_clickable"});
    anchor.parentNode.className = "feature_clicked";
    client.getFeature(feature.handle, function (err, data) {
        if (err) {
            (typeof console == "undefined") ? alert(e) : console.error(e);
        } else {
            geojson.features([data]);
            map.center({lon: (feature.bounds[0]+feature.bounds[2])/2, lat: (feature.bounds[1]+feature.bounds[3])/2});
        }
    });
}

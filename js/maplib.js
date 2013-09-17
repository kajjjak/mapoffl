/* requires leafletjs */

_MAPLIB_DEFAULT_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAA4ElEQVRYw+2ZsQkCQRAAD4wEU8ECrMEaHmzC6MoQvg/hmxCE78AaLEAwFYyEdTcweJS/C+TZkQ0mH45nbn8viUgikUI4hP9JOOfskqmE1zThq7IhCYtyVxqSsPFUdiThN3uasHFQZiRh46jMScLGWVmShI1Lbau9CEttq0vCMjHFVnsTLrbao/Boqz0Lf221d+GPVhOEB62mCBs97YRXFOGTsqB8wx2pEi3ppsuUm+6hbCnT2u0X01rMw2ONJQgPGutduCP9NbekzU+mbH6KjfUkXNXY2A+73sDHo0wIA4VfkiVRi8ohOKQAAAAASUVORK5CYII=";
var funcLayer = new L.TileLayer.Functional(function (view) {
    var path = "/kajjjak.map-wgrdoudp/{z}/{y}/{x}.png" 
        .replace('{z}', view.zoom)
        .replace('{x}', view.tile.row)
        .replace('{y}', view.tile.column)
        .replace('{s}', view.subdomain);
    var img_base = localStorageGetItem ("/tiles" + path);
    if ((img_base == undefined) || (img_base.length < 10)) {
        if (hasNetworkConnection()){
            console.info ("Loading from server for " + path);
            return "http://api.tiles.mapbox.com/v3" + path;                    
        } else {
            console.info ("Loading default image for " + path);
            return default_image;
        }
    } else {
    	console.info ("Loading cached image for " + path);
        return img_base;
    }
	}, {
    subdomains: '1234'
});


MapLib = function() {
	
	//this.layerFn = funcLayer;
	
	this.create = function(el, options){
		var options = options || {};
		options.zoom = options.zoom || options.minZoom || 17;
		if (!window.L){ throw "Leafletjs method L not found. Make sure to include the leaflet library"; }
		if (options.offline){
			options.minZoom = this.zoom;
			options.maxZoom = this.zoom;
		}
		options.layers = [funcLayer];
		options.center = options.center || [64.1404809, -21.9113811];
		/* create the map */
    this.map = L.map('map', {
      'layers': [funcLayer]
    }).setView(options.center, this.zoom);
		this.options = options;
	};
	
};

var mapLib = new MapLib();

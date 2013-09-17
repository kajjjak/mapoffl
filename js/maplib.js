/* requires leafletjs */

_MAPLIB_DEFAULT_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAA4ElEQVRYw+2ZsQkCQRAAD4wEU8ECrMEaHmzC6MoQvg/hmxCE78AaLEAwFYyEdTcweJS/C+TZkQ0mH45nbn8viUgikUI4hP9JOOfskqmE1zThq7IhCYtyVxqSsPFUdiThN3uasHFQZiRh46jMScLGWVmShI1Lbau9CEttq0vCMjHFVnsTLrbao/Boqz0Lf221d+GPVhOEB62mCBs97YRXFOGTsqB8wx2pEi3ppsuUm+6hbCnT2u0X01rMw2ONJQgPGutduCP9NbekzU+mbH6KjfUkXNXY2A+73sDHo0wIA4VfkiVRi8ohOKQAAAAASUVORK5CYII=";

MapLib = function() {
	this.layers = {};

	this.setLayerIconByLatLngs = function(layer_name, latlngs, mapping){
		/*
			The layer name
			List of objects having latlngs
			Mapping of those objects (for instance if latlngs=[{icon:}])
		*/
		options = options || {};
		options.color = options.color || "green";
		options.opacity = options.opacity || 0.8;
		options.weight = options.weight || 8;
		options.smoothFactor = options.smoothFactor || 0.5;
		if(!this.layers[layer_name]){this.layers[layer_name] = new L.LayerGroup();}
		var pl = L.polyline(latlngs, options)
		pl.addTo(this.layers[layer_name]);
		this.layers[layer_name].map_bounds = pl.getBounds();
	};

	this.layerFn = new L.TileLayer.Functional(function (view) {
			if (view.zoom && view.tile.row && view.tile.column && view.subdomain){
		    var path = "/kajjjak.map-wgrdoudp/{z}/{y}/{x}.png" 
		        .replace('{z}', view.zoom)
		        .replace('{x}', view.tile.row)
		        .replace('{y}', view.tile.column)
		        .replace('{s}', view.subdomain);
		    var img_base = undefined; //localStorageGetItem ("/tiles" + path);
		    if ((img_base == undefined) || (img_base.length < 10)) {
		        if (navigator.onLine){
		            console.info ("Loading from server for " + path);
		            return "http://api.tiles.mapbox.com/v3" + path;                    
		        } else {
		            console.info ("Loading default image for " + path);
		            return _MAPLIB_DEFAULT_IMAGE;
		        }
		    } else { 
		    	console.info ("Loading cached image for " + path);
		        return img_base;
		    }
			} else {
				return _MAPLIB_DEFAULT_IMAGE;
			}
		}, {
	    subdomains: '1234'
	});
	
	this.create = function(el_id, options){
		var options = options || {};
		options.zoom = options.zoom || options.minZoom || 17;
		if (!window.L){ throw "Leafletjs method L not found. Make sure to include the leaflet library"; }
		if (options.offline){
			options.minZoom = this.zoom;
			options.maxZoom = this.zoom;
		}
		options.layers = [this.layerFn];
		options.center = options.center || [64.1404809, -21.9113811];
		/* create the map */
    this.map = L.map(el_id, options).setView(options.center, options.zoom);
		this.options = options;
		
		this.map.setView(options.center, 10);
	};
	
	this.clearLayer = function(layer_name){
		if(this.layers[layer_name]){
			this.layers[layer_name].clearLayers();
			this.layers[layer_name]._latlngs = undefined;
		}
	};	
	
	this.showLayer = function(layer_name, visible, fitbounds){
		/* name of layer to show, and boolean visible and fitbounds to show entire area 
			returns false if layer does not exist
		*/
		if(!this.layers[layer_name]){ return false; }
		if(visible){
			this.layers[layer_name].addTo(this.map);
		}else{
			this.map.removeLayer(this.layers[layer_name]);
		}
		if(fitbounds){
			this.map.fitBounds(this.layers[layer_name].map_bounds);	
		}
		return true;
	}
	
};

var mapLib = new MapLib();

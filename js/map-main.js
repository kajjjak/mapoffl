function Map(){
	this.layers = {};
	
  if ( arguments.callee._singletonInstance )
    return arguments.callee._singletonInstance;
  arguments.callee._singletonInstance = this;

	this.getMap = function(){
		return this.map;
	};
	
	this.setCenter = function(latlng){
		this.map.setView(latlng, this.map.getZoom());
	};

	this.createMap = function(el, latlng, zoom, max_zoom){
		this.map = L.map(el).setView(latlng, zoom || 13);
		var key = "kajjjak.map-wgrdoudp";
		var url = "http://api.tiles.mapbox.com/v3/" + key + "/{z}/{x}/{y}.png";
		L.tileLayer(url, {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
		    maxZoom: max_zoom
		}).addTo(this.map);
		return this.map;
	};

	this.drawLine = function(latlngs, layer_name, options){
		latlng_array = [];
		for (var i = 0; i < latlngs.length; i++){
			latlng_array.push(new L.LatLng(latlngs[i][0], latlngs[i][1]));
		}
		this.addLineByLatLng(latlng_array, layer_name, options);
	};
		
	this.addMarker = function(latitude, longitude, layer_name, click_fn){
		var m = map.getMap();
		if(!this.layers[layer_name]){this.layers[layer_name] = new L.LayerGroup(); this.layers[layer_name].addTo(m);}
		var mrkr = L.marker([latitude, longitude]);
		mrkr.on('click', function(){
			click_fn(mrkr);
		});
		mrkr.addTo(this.layers[layer_name]);
		if(!this.layers[layer_name]._markers){this.layers[layer_name]._markers = [];}
		this.layers[layer_name]._markers.push(mrkr);
		return mrkr;
	};


	this.appendLineToPosition = function(latitude, longitude, layer_name, options){
		var latlng = [latitude, longitude];
		if(!this.layers[layer_name]){this.layers[layer_name] = new L.LayerGroup(); this.layers[layer_name].addTo(this.map);}
		if(!this.layers[layer_name]._latlngs){this.layers[layer_name]._latlngs = [latlng]; return;}
		var l = this.layers[layer_name]._latlngs.length;
		var pold = this.layers[layer_name]._latlngs[l - 1];
		var pnew = latlng;
		var a = new L.LatLng(pold[0], pold[1]);
		var b = new L.LatLng(pnew[0], pnew[1]);
		this.addLineByLatLng([a,b], layer_name, options);
		this.layers[layer_name]._latlngs.push(latlng);
		return b;
	};	

	this.addLineByLatLng = function(latlngs, layer_name, options){
		options = options || {};
		options.color = options.color || "red";
		options.opacity = options.opacity || 0.8;
		options.weight = options.weight || 8;
		options.smoothFactor = options.smoothFactor || 0.5;
		if(!this.layers[layer_name]){this.layers[layer_name] = new L.LayerGroup(); this.layers[layer_name].addTo(this.map);}
		var pl = L.polyline(latlngs, options)
		pl.addTo(this.layers[layer_name]);
	};
	
	this.clearLayer = function(layer_name){
		if(this.layers[layer_name]){
			this.layers[layer_name].clearLayers();
			this.layers[layer_name]._latlngs = undefined;
		}
	};
	
	this.clickMap = function(callback){
		this.click_map = callback;
		if (callback){
			this.map.on('click', function(e) {
		  	  map.click_map(e.latlng);
			});
		} else {
			this.map.off('click', undefined);			
		}
	};
	

	this._getDistanceBetween = function(latlng1, latlng2){
		var lat1 = latlng1.lat;
		var lon1 = latlng1.lng;
		var lat2 = latlng2.lat;
		var lon2 = latlng2.lng;
		var R = 6371; // km
		var d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
		                  Math.cos(lat1)*Math.cos(lat2) *
		                  Math.cos(lon2-lon1)) * R;
		return d; 
	}
	
	this.getNearbyMarkers = function(latlng, layer_name, range, within_range_callback){
		if (!this.layers[layer_name]){ return []; }
		if (!this.layers[layer_name]._markers){ return []; }
		var mrkrs = this.layers[layer_name]._markers;
		for (indx in mrkrs){
			var mrkr = mrkrs[indx];
			var dist = map._getDistanceBetween(latlng, mrkr.getLatLng());
			if (dist < range){
				within_range_callback(this.layers[layer_name]._markers[indx]);
			}
		}
	}
	
}
var map = new Map();

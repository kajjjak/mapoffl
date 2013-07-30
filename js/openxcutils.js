function OpenXCReader(){
	/* collects the data and flushes */
	
	this.buffer = {}
	this.cached = {}
	
	this.readLine = function(line){
		//expects json data having format
		// {"timestamp": 1351181576.64078, "name": "engine_speed", "value": 714.0}
		// where name can have different properties
		var m;
		var buff = this.buffer[line.name];
		if(!buff){ buff = []; }
		if(buff[buff.length - 1] != line.value){buff.push(line.value);}
		if (this.hasReadLineFlush(line.name)){
			m = this.flush();
		}
		this.cached[line.name] = line.value;
		this.buffer[line.name] = buff;
		if(this.onDataRead){this.onDataRead(this.cached);}
		return m; 
	};
	
	this.hasReadLineFlush = function(attr){
		if (this.buffer.vehicle_speed && this.buffer.latitude && this.buffer.longitude){
			return true;
		}
		return false;
	};
	
	this.flush = function(){
		//console.info("saving " + JSON.stringify(this.buffer));
		var m = window.vehicle_readings.create(this.buffer);
		this.buffer = {};
		return m;
	};
}

var carReader = new OpenXCReader();
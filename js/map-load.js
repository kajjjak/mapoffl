
function readLines(){
  window.vehicle_data_view.clearAll();
	for (var i in vehicle_data){
		carReader.readLine(vehicle_data[i]);
	}
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function showDriversPath(){
	vehicle_readings.forEach(function(m){
		addDriversPath(m);
	});
}

green_factor = 1;
function addDriversPath(m){
	var speed = m.attributes.vehicle_speed[0];
	var lat = m.attributes.latitude[0];
	var lng = m.attributes.longitude[0];
	var opacity = green_factor;//speed/80;
	//console.info("color " + 255*(speed/80));
	return map.appendLineToPosition(lat, lng, "driver_path", {"color": "darkgreen", "opacity": opacity});	
}

function stopDriversPathSimulation(){
	if(window.vehicle_simulation_id){clearInterval(vehicle_simulation_id);}
	window.vehicle_simulation_id = undefined;
	window.vehicle_simulation_data = [];
}


function howGreen(d){
	//http://www.epa.gov/otaq/models/ngm/420p05001.pdf
	window.vehicle_data_read = window.vehicle_data_read || {};
	var gears = {"first":1, "second":2, "third":3, "fourth":4, "fifth":5, "sixth":6, "seventh":7, "eighth":8, "reverse":1, "neutral":0};
	var gears_efficency = {0:0.87, 1:0.722, 2:0.809, 3:0.87, 4:0.87, 5:0.87, 6:0.87, 7:0.87, 8:0.87}; // based on Bishop & Kluger, 1996
	var gear_efficiency = gears_efficency[gears[d.transmission_gear_position]] - 0.722; //scale upp to 1
	var rpm_efficiency = gear_efficiency;
	var overal_efficiency = (gear_efficiency+rpm_efficiency)/2.0;
	
	if (d.accelerator_pedal_position){
		if ((accelerator_pedal_position < vehicle_data_read.accelerator_pedal_position) && (d.vehicle_speed > vehicle_data_read.vehicle_speed)){
			overal_efficiency = 1;	
		}				
	}
	vehicle_data_read = d;
	return overal_efficiency;
}

function runDriversPathSimulation(vehicle_data_collection){
	stopDriversPathSimulation();
	vehicle_simulation_data = vehicle_data_test_1;
	vehicle_simulation_index = 0;
	vehicle_simulation_length = vehicle_simulation_data.length;
	map.clearLayer("driver_path");
	
	carReader.onDataRead = function(d){
		green_factor = howGreen(d);
		drawGauge(d.vehicle_speed,d.engine_speed,d.fuel_level);
		$("#vehicle_simulation_step").html("Step: " + vehicle_simulation_index + " (" + (parseInt(1000*vehicle_simulation_index/vehicle_simulation_length))/10 + " %)");
		$("#vehicle_speed").html("vehicle_speed: " + d.vehicle_speed);
		$("#vehicle_green").html("vehicle_green: " + green_factor);
		$("#fuel_consumed_since_restart").html("fuel_consumed_since_restart: " + d.fuel_consumed_since_restart);
		$("#ignition_status").html("ignition_status: " + d.ignition_status);
		$("#headlamp_status").html("headlamp_status: " + d.headlamp_status);
		$("#high_beam_status").html("high_beam_status: " + d.high_beam_status);
		$("#brake_pedal_status").html("brake_pedal_status: " + d.brake_pedal_status);
		$("#parking_brake_status").html("parking_brake_status: " + d.parking_brake_status);
		/*
		$("#torque_at_transmission").html("torque_at_transmission: " + d.torque_at_transmission);
		$("#transmission_gear_position").html("transmission_gear_position: " + d.transmission_gear_position);
		$("#odometer").html("odometer: " + d.odometer);
		$("#fuel_level").html("fuel_level: " + d.fuel_level);
		$("#fine_odometer_since_restart").html("fine_odometer_since_restart: " + d.fine_odometer_since_restart);
		$("#accelerator_pedal_position").html("accelerator_pedal_position: " + d.accelerator_pedal_position);
		*/
	};

	vehicle_simulation_id = setInterval(function(){ //TODO: use requestAnimationFrame
		if (vehicle_simulation_data.length > vehicle_simulation_index){
			var d = vehicle_simulation_data[vehicle_simulation_index];
			vehicle_simulation_index = vehicle_simulation_index + 1;
			readVehicleData(d);
		}
	}, 10);
}

function readVehicleData(d){
	var m = carReader.readLine(d);
	if (m){
		var p = addDriversPath(m);
		map.setCenter(p);
		map.getNearbyMarkers(p, "route", 1, function(rule){
			var r = rule._bbm;
			var vehicle_speed = m.get("vehicle_speed")[0];
			var rule_speed = r.get("speed_limit");
			console.info("Detected rule " + vehicle_speed + "  " + rule_speed);
		});
	}	
}

function _c(ts, name, value){
	if (ts === ""){ ts = new Date().getTime(); }
	switch (name) {
		case "ignition_status": break;
		case "transmission_gear_position": break;
		case "windshield_wiper_status": break;
		case "headlamp_status":
			if (value == "true"){value = true;} else {value = false;} break;
		case "parking_brake_status":
			if (value == "true"){value = true;} else {value = false;} break;
		case "headlamp_status":
			if (value == "true"){value = true;} else {value = false;} break;
		case "high_beam_status":
			if (value == "true"){value = true;} else {value = false;} break;
		default:
			value = parseFloat(value); break;
	}
	readVehicleData({timestamp: ts, name: name, value: value});
}
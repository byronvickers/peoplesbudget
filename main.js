
lineIntersect = require('@turf/line-intersect').default
lineDistance = require('@turf/point-to-line-distance').default
distance = require('@turf/distance').default
centroid = require('@turf/centroid').default
agentmaps = require('agentmaps').default
routing = require('agentmaps/src/routing')

let act_finance_units = [
  {latLong: [-35.281577, 149.128260], label: 'Government<br/>Finances'},
  {latLong: [-35.311588, 149.140441], label: 'Health'},
  // {latLong: [-35.302478, 149.128939], label: 'Education'},
  {latLong: [-35.288656, 149.093255], label: 'Education'},
  {latLong: [-35.279100, 149.103255], label: 'General<br/>Public Services'},
  {latLong: [-35.267703, 149.124941], label: 'Other Purposes'},
  {latLong: [-35.299189, 149.107698], label: 'Public Order<br/>and Safety'},
  {latLong: [-35.309832, 149.112977], label: 'Transport and<br/>Communications'},
  {latLong: [-35.299660, 149.153263], label: 'Social Security'},
  {latLong: [-35.288656, 149.157575], label: 'Housing and<br/>Community Amenities'},
  {latLong: [-35.271080, 149.162316], label: 'Recreation and<br/>Culture'},
  // {latLong: [-35.316830, 149.130198], label: 'Other Economic Affairs'},
  // {latLong: [-35.279409, 149.080994], label: 'Mining and Mineral Resources Other than Fuels, Manufacturing and Construction'},
  // {latLong: [-35.253063, 149.160484], label: 'Fuel and Energy'},
  // {latLong: [-35.243412, 149.137008], label: 'Agriculture, Forestry, Fishing and Hunting'}
];

let act_finance_rates = [
  {destinationLatLong: [-35.2823, 149.1250], rate: 1467927},
  // {destinationLatLong: [-35.302478, 149.128939], rate: 1117912},
  {destinationLatLong: [-35.288656, 149.093255], rate: 1117912},
  {destinationLatLong: [-35.279100, 149.103255], rate: 603719},
  {destinationLatLong: [-35.267703, 149.124941], rate: 500225},
  {destinationLatLong: [-35.299189, 149.107698], rate: 431867},
  {destinationLatLong: [-35.309832, 149.112977], rate: 347192},
  {destinationLatLong: [-35.299660, 149.153263], rate: 344366},
  {destinationLatLong: [-35.288656, 149.157575], rate: 239152},
  {destinationLatLong: [-35.271080, 149.162316], rate: 222161},
  // {destinationLatLong: [-35.316830, 149.130198], rate: 87130},
  // {destinationLatLong: [-35.279409, 149.080994], rate: 24939},
  // {destinationLatLong: [-35.253063, 149.160484], rate: 19174},
  // {destinationLatLong: [-35.243412, 149.137008], rate: 4816},
];
financeTotal = 0
act_finance_rates.forEach(function(rateObj){
  financeTotal += rateObj.rate
});

let street_options = {
  "color": "yellow",
  "weight": 4,
  "opacity": 0
};
let unit_options = {
  front_buffer: 6,
  side_buffer: 3,
  length: 10,
  depth: 18,
  color: "blue",
  opacity: 0
};

let starting_point = [-35.2823, 149.1250];
// let bounding_points = [[-35.2515, 149.0628], [-35.3297, 149.1870]];

let bounding_points = [[-35.2515, 149.0628], [-35.3297, 149.1870]];
let map = L.map("demo_map", {zoomControl: false}).fitBounds(bounding_points).setZoom(13);
var palette = ['#35477d','#6c5b7b','#c06c84','#f67280']
window.map = map;

L.tileLayer(
    "http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png",
    {
        attribution: "Thanks to <a href=\"http://openstreetmap.org\">OpenStreetMap</a> community",
    }
).addTo(map);

act_finance_units.forEach((item, index) => {
  if (index === 0) {
    let itemBounds = [[item.latLong[0] - 0.005, item.latLong[1] - 0.01], [item.latLong[0] + 0.005, item.latLong[1] + 0.01]]
    L.circle(item.latLong, {radius: 600, color: '#C3423F', weight: 1, fillOpacity: 0.8}).bindTooltip(item.label, {opacity: 1, direction: 'center', permanent: true, className: 'labelstyle'}).addTo(map);
  }
  else {
    let itemBounds = [[item.latLong[0] - 0.0025, item.latLong[1] - 0.01], [item.latLong[0] + 0.0025, item.latLong[1] + 0.01]]
    L.rectangle(itemBounds, {color: palette[index % 8], weight: 1, fillOpacity: 0.8}).bindTooltip(item.label, {opacity: 1, direction: 'center', permanent: true, className: 'labelstyle'}).addTo(map);
  }
})

agentmap = L.A.agentmap(map);


function AgentMaker(id){
  // center_point = {
  //     "type":"Feature",
  //     "geometry": {
  //       "type": "Point",
  //       coordinates: starting_point
  //     },
  //     "properties": {}
  // }
  unit_idx = 350
  unit = agentmap.units.getLayers()[unit_idx]
  unit_id = agentmap.units.getLayerId(unit)
  center_point = centroid(unit.feature)
  center_point.properties.place = {"type": "unit", "id": unit_id},
  center_point.properties.layer_options = {
    radius: 8,
    color: "green",
    fillColor: "green",
    fillOpacity: 0.8,
    strokeOpacity: 0.8,
    opacity: 0.5};
  return center_point;
}

agentmap.controller = function(){
  if (agentmap.state.ticks % 20 === 0){
    agentmap.agentify(1, AgentMaker);

    agentmap.agents.eachLayer(function(agent) {
      if(agent.trip.path.length == 0 ){
        if(agent.steps_made > 0){
          agentmap.agents.removeLayer(agent)
          delete agent
        }
        randVal = Math.random()*financeTotal
        runningTotal = 0
        act_finance_rates.forEach(function(rateObj){
          if(runningTotal < randVal){
            runningTotal += rateObj.rate
            if(runningTotal >= randVal){
              destLatLong = rateObj.destinationLatLong
            }
          }
        });
        agent.setTravelToPlace(L.latLng(destLatLong),{type: "unanchored", id: null}, 20, true, true)
      }
    })
  }

  agentmap.agents.eachLayer(function(agent){
      agent.moveIt();
  })
}

// numAgents = 100;
// agentmap.buildingify(bounding_points, streets_data, street_options, unit_options, units_data)
agentmap.buildingify(bounding_points, map_data, street_options, unit_options, units_data)
// agentmap.agentify(numAgents, AgentMaker);
agentmap.run()
agentmap.setAnimationInterval(1)

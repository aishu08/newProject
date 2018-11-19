var authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRhcHB0LXJlcG9ydCIsImlhdCI6MTUwNTExMjkyOX0.UeuG0B8hpDLCD5Ih9sRQVlo1AxyRSBqT79mFrFd2_PU'

var floor1Id = "5856e14f89fc5c4c8c5c8118"
var floor7Id = "5856e17789fc5c4c8c5c8119"
var floor8Id = "5856e17f89fc5c4c8c5c811a"
var floor9Id = "58569fd993864447df3c42e7"
var floor10Id = "5856e18689fc5c4c8c5c811b"
var buildingId = "58569f6c93864447df3c42e6"
//var floor1utildata ,floor7utildata , floor8utildata ,  floor9utildata ,  floor10utildata = false;
var sday = GetURLParameter('sday')
var smonth = GetURLParameter('smonth')
var syear = GetURLParameter('syear')
var eday = GetURLParameter('eday')
var emonth = GetURLParameter('emonth')
var eyear = GetURLParameter('eyear')
d = new Date()
sd = new Date(syear+'-'+smonth+'-'+sday)
ed = new Date(eyear+'-'+emonth+'-'+eday)
$('#date-endDate').html(eday+'-'+emonth+'-'+eyear);
d.toLocaleDateString()
$('#date-today').html(d.toLocaleDateString());
$('#date-today1').html(sday+'-'+smonth+'-'+syear); 
$('#today-date2').html(eday+'-'+emonth+'-'+eyear);

// var eday = 4
// var emonth = 9
// var eyear = 2017
// var sday = 4
// var smonth = 9
// var syear = 2017

window.returnTitle = function() {
  return document.title;
};

    // radarChart-------------------------
var chartHide=0;
var w = 250,
    h = 250;

var margin = {top: 75, right: 75, bottom: 75, left: 75},
                width = Math.min(450, window.innerWidth - 10) - margin.left - margin.right,
                height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
       
                
            var radarChartOptions = {
              w: width,
              h: height,
              margin: margin,
              maxValue: 0.5,
              levels: 5,
              roundStrokes: true,
             // color: color
            };                
var colorscale = d3.scale.category10();

//Legend titles
var LegendOptions = ['Arraystorm'];

var labelData 
var level1Data = {}
var level7Data = {}
var level8Data = {}
var level9Data = {}
var level10Data = {}
var BuildingData = {}

//Floor1
$.ajax({
    type:"GET",
    url:"/reportApi/utilData/5856e14f89fc5c4c8c5c8118?eday="+eday+"&emonth="+emonth+"&eyear="+eyear+"&sday="+sday+"&smonth="+smonth+"&syear="+syear,
    success:function(response){
        // console.log(data)

            var unusedSeatsf1 = hourSeats1f1 = hourSeats2f1 = hourSeats3f1 = hourSeats4f1 = 0;
            response.used.forEach(function(value){
                if(value == 0.000 && value < 0.166)
                    unusedSeatsf1++;
                else if(value >= 0.166 && value <= 4)
                    hourSeats1f1++;
                else if(value > 4 && value <= 8)
                    hourSeats2f1++;
                else if(value > 8)
                    hourSeats3f1++;
            })
            var seatCountf1 = response.used.length;
            var totalHoursf1 = response.totalHours;
            //console.log(seatCount);
            chart = $("#bar-graph1").highcharts();
            chart.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
            chart.series[0].setData([seatCountf1 - unusedSeatsf1, seatCountf1 - hourSeats1f1, seatCountf1 - hourSeats2f1, seatCountf1 - hourSeats3f1])
            chart.series[1].setData([unusedSeatsf1, hourSeats1f1, hourSeats2f1, hourSeats3f1])
            $.ajax({
                type:"GET",
                url:"/reportApi/utilData/5856e17789fc5c4c8c5c8119?eday="+eday+"&emonth="+emonth+"&eyear="+eyear+"&sday="+sday+"&smonth="+smonth+"&syear="+syear,
                success:function(response){
                    // console.log(data)

                var unusedSeatsf7 = hourSeats1f7 = hourSeats2f7 = hourSeats3f7 = hourSeats4f7 = 0;
                response.used.forEach(function(value){
                    if(value == 0.000 && value < 0.166)
                        unusedSeatsf7++;
                    else if(value >= 0.166 && value <= 4)
                        hourSeats1f7++;
                    else if(value > 4 && value <= 8)
                        hourSeats2f7++;
                    else if(value > 8)
                        hourSeats3f7++;
                })
                var seatCountf7 = response.used.length;
                var totalHours = response.totalHours;
                //console.log(seatCount);
                chart = $("#bar-graph2").highcharts();
                chart.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
                chart.series[0].setData([seatCountf7 - unusedSeatsf7, seatCountf7 - hourSeats1f7, seatCountf7 - hourSeats2f7, seatCountf7 - hourSeats3f7])
                chart.series[1].setData([unusedSeatsf7, hourSeats1f7, hourSeats2f7, hourSeats3f7])
                $.ajax({
                type:"GET",
                url:"/reportApi/utilData/5856e17f89fc5c4c8c5c811a?eday="+eday+"&emonth="+emonth+"&eyear="+eyear+"&sday="+sday+"&smonth="+smonth+"&syear="+syear,
                success:function(response){
                    // console.log(data)

                var unusedSeatsf8 = hourSeats1f8 = hourSeats2f8 = hourSeats3f8 = hourSeats4f8 = 0;
                response.used.forEach(function(value){
                    if(value == 0.000 && value < 0.166)
                        unusedSeatsf8++;
                    else if(value >= 0.166 && value <= 4)
                        hourSeats1f8++;
                    else if(value > 4 && value <= 8)
                        hourSeats2f8++;
                    else if(value > 8)
                        hourSeats3f8++;
                })
                var seatCountf8 = response.used.length;
                var totalHours = response.totalHours;
                //console.log(seatCount);
                chart = $("#bar-graph3").highcharts();
                chart.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
                chart.series[0].setData([seatCountf8 - unusedSeatsf8, seatCountf8 - hourSeats1f8, seatCountf8 - hourSeats2f8, seatCountf8 - hourSeats3f8])
                chart.series[1].setData([unusedSeatsf8, hourSeats1f8, hourSeats2f8, hourSeats3f8])

                $.ajax({
                    type:"GET",
                    url:"/reportApi/utilData/58569fd993864447df3c42e7?eday="+eday+"&emonth="+emonth+"&eyear="+eyear+"&sday="+sday+"&smonth="+smonth+"&syear="+syear,
                    success:function(response){
                        // console.log(data)

                    var unusedSeatsf9 = hourSeats1f9 = hourSeats2f9 = hourSeats3f9 = hourSeats4f9 = 0;
                    response.used.forEach(function(value){
                        if(value == 0.000 && value < 0.166)
                            unusedSeatsf9++;
                        else if(value >= 0.166 && value <= 4)
                            hourSeats1f9++;
                        else if(value > 4 && value <= 8)
                            hourSeats2f9++;
                        else if(value > 8)
                            hourSeats3f9++;
                    })
                    var seatCountf9 = response.used.length;
                    var totalHours = response.totalHours;
                    //console.log(seatCount);
                    chart = $("#bar-graph4").highcharts();
                    chart.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
                    chart.series[0].setData([seatCountf9 - unusedSeatsf9, seatCountf9 - hourSeats1f9, seatCountf9 - hourSeats2f9, seatCountf9 - hourSeats3f9])
                    chart.series[1].setData([unusedSeatsf9, hourSeats1f9, hourSeats2f9, hourSeats3f9])
                    $.ajax({
                        type:"GET",
                        url:"/reportApi/utilData/5856e18689fc5c4c8c5c811b?eday="+eday+"&emonth="+emonth+"&eyear="+eyear+"&sday="+sday+"&smonth="+smonth+"&syear="+syear,
                        success:function(response){
                            // console.log(data)

                        var unusedSeatsf10 = hourSeats1f10 = hourSeats2f10 = hourSeats3f10 = hourSeats4f10 = 0;
                        response.used.forEach(function(value){
                            if(value == 0.000 && value < 0.166)
                                unusedSeatsf10++;
                            else if(value >= 0.166 && value <= 4)
                                hourSeats1f10++;
                            else if(value > 4 && value <= 8)
                                hourSeats2f10++;
                            else if(value > 8)
                                hourSeats3f10++;
                        })
                        var seatCountf10 = response.used.length;
                        var totalHours = response.totalHours;
                        //console.log(seatCount);
                        chart = $("#bar-graph5").highcharts();
                        chart.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
                        chart.series[0].setData([seatCountf10 - unusedSeatsf10, seatCountf10 - hourSeats1f10, seatCountf10 - hourSeats2f10, seatCountf10 - hourSeats3f10])
                        chart.series[1].setData([unusedSeatsf10, hourSeats1f10, hourSeats2f10, hourSeats3f10])
                        
                        totalSeats= seatCountf1 +seatCountf7 +seatCountf8 +seatCountf9 +seatCountf10
                        totalUnused = unusedSeatsf1 + unusedSeatsf7 + unusedSeatsf8 + unusedSeatsf9 + unusedSeatsf10
                        totalHourSeat1 = hourSeats1f1 + hourSeats1f7 + hourSeats1f8 + hourSeats1f9 + hourSeats1f10
                        totalHourSeat2 = hourSeats2f1 + hourSeats2f7 + hourSeats2f8 + hourSeats2f9 + hourSeats2f10
                        totalHourSeat3 = hourSeats3f1 + hourSeats3f7 + hourSeats3f8 + hourSeats3f9 + hourSeats3f10

                        chart1 = $("#bar-graph").highcharts();
                        chart1.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
                        chart1.series[0].setData([totalSeats - totalUnused, totalSeats - totalHourSeat1, totalSeats - totalHourSeat2, totalSeats - totalHourSeat3])
                        chart1.series[1].setData([totalUnused, totalHourSeat1, totalHourSeat2, totalHourSeat3])
                        

                        },
                        error:function(data){
                            console.log(data)
                        }
                    });
                    },
                    error:function(data){
                        console.log(data)
                    }
                });
                },
                error:function(data){
                    console.log(data)
                }
            });



                },
                error:function(data){
                    console.log(data)
                }
            });


    },
    error:function(data){
        console.log(data)
    }
});

$.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    //dataType: "json",
    //contentType:"application/x-www-form-urlencoded; charset=utf-8",
    url: "/reportApi/occupancyPattern/58569f6c93864447df3c42e6?eday="+eday+"&emonth="+emonth+"&eyear="+eyear+"&sday="+sday+"&smonth="+smonth+"&syear="+syear,
    success: function(msg) {
        labelData = msg.labels
        //console.log(labelData)
        console.log(msg)
        msg.occupancyPattern.forEach(function(o){
            if(o.name == 'Level 1'){
                level1Data.totalSeats = o.totalSeats
                level1Data.name = o.name
                level1Data.values = o.values 
                var chart1 = $('#occupancy1').highcharts(); 
                chart1.series[0].setData(level1Data.values)
                chart1.xAxis[0].setCategories(labelData)
            }
            if(o.name == 'Level 7'){
                level7Data.totalSeats = o.totalSeats
                level7Data.name = o.name
                level7Data.values = o.values 
                var chart2 = $('#occupancy2').highcharts(); 
                chart2.series[0].setData(level7Data.values)
                chart2.xAxis[0].setCategories(labelData)
            }
            if(o.name == 'Level 8'){
                level8Data.totalSeats = o.totalSeats
                level8Data.name = o.name
                level8Data.values = o.values 
                var chart3 = $('#occupancy3').highcharts(); 
                chart3.series[0].setData(level8Data.values)
                chart3.xAxis[0].setCategories(labelData)
            }
            if(o.name == 'Level 9'){
                level9Data.totalSeats = o.totalSeats
                level9Data.name = o.name
                level9Data.values = o.values 
                var chart4 = $('#occupancy4').highcharts(); 
                chart4.series[0].setData(level9Data.values)
                chart4.xAxis[0].setCategories(labelData)
            }
          if(o.name == 'Level 10'){
                level10Data.totalSeats = o.totalSeats
                level10Data.name = o.name
                level10Data.values = o.values 
                var chart5 = $('#occupancy5').highcharts(); 
                chart5.series[0].setData(level10Data.values)
                chart5.xAxis[0].setCategories(labelData)
            }
          if(o.name == 'Building Average'){
                BuildingData.totalSeats = o.totalSeats
                BuildingData.name = o.name
                BuildingData.values = o.values
                var chart = $('#occupancy').highcharts(); 
                chart.series[0].setData(BuildingData.values)
                chart.xAxis[0].setCategories(labelData)
            }
        })
    },
    error:function(data){
        console.log('error')
        console.log(data)
        //  alert(data)
    }
}); 




////////////////////////////////////////////
/////////// Initiate legend ////////////////
////////////////////////////////////////////

var svg = d3.select('#rader-body')
  .selectAll('svg')
  .append('svg')
  .attr("width", w+500)
  .attr("height", h+300)

//Create the title for the legend
var text = svg.append("text")
  .attr("class", "title")
  .attr('transform', 'translate(135,425)')
  .attr("font-size", "14px")
  .attr("font-weight", 900)
  .attr("fill", "black")
  .text("Legend");
    
//Initiate Legend 
var legend = svg.append("g")
  .attr("class", "legend")
  .attr("height", 100)
  .attr("width", 200)
  .attr('transform', 'translate(-80,415)')

  ;
  //Create colour squares
  legend.selectAll('rect')
    .data(LegendOptions)
    .enter()
    .append("rect")
    .attr("x", w - 65)
    .attr("y", function(d, i){ return i * 20;})
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function(d, i){ return colorscale(i);})
    ;
  //Create text next to squares
  legend.selectAll('text')
    .data(LegendOptions)
    .enter()
    .append("text")
    .attr("x", w - 52)
    .attr("y", function(d, i){ return i * 20 + 9;})
    .attr("font-size", "11px")
    .attr("fill", "black")
    .text(function(d) { return d; })
    .on('click', function(){
        console.log("clicked")
        var newOpacity, active;
        // var active=dataRow.active ? true:false,
        // if(dataRow.active == true){
        //     active=true;
        //     newOpacity = 1;
        // }
        // else{
        //     active=false;
        //     newOpacity = 0;
        // }
        // newOpacity=active ? 1:0;

        if(chartHide==0){
        active=d3.select("#dataRow0").style("fill-opacity",0);
        chartHide=1;}
        else{
        active=d3.select("#dataRow0").style("fill-opacity",0.5);
        chartHide=0;
        }
        
        console.log(active)
    }); 

    obj = $('#rader-body').find('svg')
    /*obj[0].setAttribute('width', 275)*/


   // Highcharts
     $('#occupancy').highcharts({
        exporting: {
            enabled: false,
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false

                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        chart: {
            backgroundColor: 'transparent',
            type: 'areaspline',
            color: '#2A2A2A'
        },
        title: {
            text:'OCCUPANCY PATTERN PLOT',
            style:{
                color: '#2A2A2A',
                fontFamily: 'Libre Franklin',
                fontSize:'18px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Time(hours)',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
            categories: ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Seats Booked',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.13
            },
            enableMouseTracking: false
        },
        series: [{
            showInLegend: true,
            name:'seat Booking',
            data: [0,0,0,0,0,0,4,0,0,0,0,5,0,0,0,0,0,2,0,0,10,4,0,2,0],
            color: '#0183A5',
            dataLabels:{
                enabled:true,
                style: {
                    textShadow: 'none',
                    color: "#2A2A2A"
                }
            }

        }]
    });
     $('#occupancy1').highcharts({
        exporting: {
            enabled: false,
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false

                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        chart: {
            backgroundColor: 'transparent',
            type: 'areaspline',
            color: '#2A2A2A'
        },
        title: {
            text:'OCCUPANCY PATTERN PLOT',
            style:{
                color: '#2A2A2A',
                fontFamily: 'Libre Franklin',
                fontSize:'18px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Time(hours)',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
            categories: ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Seats Booked',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.13
            },
            enableMouseTracking: false
        },
        series: [{
            showInLegend: true,
            name:'seat Booking',
            data: [0,0,0,0,0,0,4,0,0,0,0,5,0,0,0,0,0,2,0,0,10,4,0,2,0],
            color: '#0183A5',
            dataLabels:{
                enabled:true,
                style: {
                    textShadow: 'none',
                    color: "#2A2A2A"
                }
            }

        }]
    });
     $('#occupancy2').highcharts({
        exporting: {
            enabled: false,
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false

                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        chart: {
            backgroundColor: 'transparent',
            type: 'areaspline',
            color: '#2A2A2A'
        },
        title: {
            text:'OCCUPANCY PATTERN PLOT',
            style:{
                color: '#2A2A2A',
                fontFamily: 'Libre Franklin',
                fontSize:'18px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Time(hours)',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
            categories: ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Seats Booked',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.13
            },
            enableMouseTracking: false
        },
        series: [{
            showInLegend: true,
            name:'seat Booking',
            data: [0,0,0,0,0,0,4,0,0,0,0,5,0,0,0,0,0,2,0,0,10,4,0,2,0],
            color: '#0183A5',
            dataLabels:{
                enabled:true,
                style: {
                    textShadow: 'none',
                    color: "#2A2A2A"
                }
            }

        }]
    });
     $('#occupancy3').highcharts({
        exporting: {
            enabled: false,
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false

                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        chart: {
            backgroundColor: 'transparent',
            type: 'areaspline',
            color: '#2A2A2A'
        },
        title: {
            text:'OCCUPANCY PATTERN PLOT',
            style:{
                color: '#2A2A2A',
                fontFamily: 'Libre Franklin',
                fontSize:'18px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Time(hours)',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
            categories: ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Seats Booked',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.13
            },
            enableMouseTracking: false
        },
        series: [{
            showInLegend: true,
            name:'seat Booking',
            data: [0,0,0,0,0,0,4,0,0,0,0,5,0,0,0,0,0,2,0,0,10,4,0,2,0],
            color: '#0183A5',
            dataLabels:{
                enabled:true,
                style: {
                    textShadow: 'none',
                    color: "#2A2A2A"
                }
            }

        }]
    });
     $('#occupancy4').highcharts({
        exporting: {
            enabled: false,
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false

                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        chart: {
            backgroundColor: 'transparent',
            type: 'areaspline',
            color: '#2A2A2A'
        },
        title: {
            text:'OCCUPANCY PATTERN PLOT',
            style:{
                color: '#2A2A2A',
                fontFamily: 'Libre Franklin',
                fontSize:'18px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Time(hours)',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
            categories: ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Seats Booked',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.13
            },
            enableMouseTracking: false
        },
        series: [{
            showInLegend: true,
            name:'seat Booking',
            data: [0,0,0,0,0,0,4,0,0,0,0,5,0,0,0,0,0,2,0,0,10,4,0,2,0],
            color: '#0183A5',
            dataLabels:{
                enabled:true,
                style: {
                    textShadow: 'none',
                    color: "#2A2A2A"
                }
            }

        }]
    });
     $('#occupancy5').highcharts({
        exporting: {
            enabled: false,
            chartOptions: { // specific options for the exported image
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false

                    }
                }
            },
            scale: 3,
            fallbackToExportServer: false
        },
        chart: {
            backgroundColor: 'transparent',
            type: 'areaspline',
            color: '#2A2A2A'
        },
        title: {
            text:'OCCUPANCY PATTERN PLOT',
            style:{
                color: '#2A2A2A',
                fontFamily: 'Libre Franklin',
                fontSize:'18px'
            }
        },
        xAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Time(hours)',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
            categories: ['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
        },
        yAxis: {
            gridLineWidth: 1,
            gridLineDashStyle:'dash',
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            title: {
                text: 'Seats Booked',
                'style':{
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
            },
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.13
            },
            enableMouseTracking: false
        },
        series: [{
            showInLegend: true,
            name:'seat Booking',
            data: [0,0,0,0,0,0,4,0,0,0,0,5,0,0,0,0,0,2,0,0,10,4,0,2,0],
            color: '#0183A5',
            dataLabels:{
                enabled:true,
                style: {
                    textShadow: 'none',
                    color: "#2A2A2A"
                }
            }

        }]
    });

    /*objd=$('#occupancy')
    objd.css('width',600)
    objd.css('height',450)
    obj=$('.highcharts-root')
    obj[0].setAttribute('width', 600)
    obj[0].setAttribute('height', 450)*/

    $('#bar-graph').highcharts(
        {
            exporting: {
            enabled: false
        },
        chart: {
            spacingTop: 30,
            backgroundColor: 'transparent',
            type: 'column',
            color: '#2A2A2A'
        },
        title: {
            text: 'UTILIZATION STATSTICS',
            style:{
                    color: '#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
        },
        xAxis: {
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            gridLineDashStyle:'dash',
            gridLineWidth: 1,
            categories: [],
            
            title: {
                text: "Floors",
                'style':
                {
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'10px'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: 90,
            itemStyle:{
                color:'#2A2A2A',
                fontStyle:'Libre Franklin',
                fontWeight:'10px'
            }
        },
        yAxis: {
            labels:{
                style:{
                    color:'#000'
                }
            },
                gridLineWidth: 1,
                gridLineDashStyle:'dash',
            min: 0,
            title: {
                text: 'SEATS',
                'style':{
                        color:'#000',
                        fontFamily: 'Libre Franklin',
                        fontSize:'10px'
                    }
            },
            stackLabels: {
                enabled: true,
                style: {
                        fontFamily: 'Libre Franklin',
                    fontWeight: 'bold',
                    color: "#2A2A2A"
                }
            }
        },
        credits: {
                enabled: false
            },
        tooltip: {
            /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
            footerFormat: '</table> ',
            */
            useHTML: true,
            shared: true,
            formatter: function(){
                var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                $.each(this.points, function(i, point){
                    var color = point.color;
                    content += '<tr><td style="color:' + color +';padding:0; font-weight:bold;"> <b>'+ point.series.name + ' Percent : </b></td>';
                    content += '<td style="padding:0"> ' + ((point.y/point.total)* 100).toFixed(1)+ '% </td></tr>'
                })
                content += '</table>';  
                return  content;
            },
            backgroundColor: '#2A2A2A',
                style:{
                    fontFamily: 'Libre Franklin',
                    padding:'10px',
                    color: '#fff'
                },
        },
        plotOptions: {
            column: {
                    borderWidth: 0,
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: '#fff',
                    style: {
                        textShadow: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Empty',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230],
            color:'#5a5a5a'
        }, {
            name: 'Filled',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200],
            color:'#0183A5'
        }]
    });
$('#bar-graph1').highcharts(
        {
            exporting: {
            enabled: false
        },
        chart: {
            spacingTop: 30,
            backgroundColor: 'transparent',
            type: 'column',
            color: '#2A2A2A'
        },
        title: {
            text: 'UTILIZATION STATSTICS',
            style:{
                    color: '#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
        },
        xAxis: {
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            gridLineDashStyle:'dash',
            gridLineWidth: 1,
            categories: [],
            
            title: {
                text: "Floors",
                'style':
                {
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'10px'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: 90,
            itemStyle:{
                color:'#2A2A2A',
                fontStyle:'Libre Franklin',
                fontWeight:'10px'
            }
        },
        yAxis: {
            labels:{
                style:{
                    color:'#000'
                }
            },
                gridLineWidth: 1,
                gridLineDashStyle:'dash',
            min: 0,
            title: {
                text: 'SEATS',
                'style':{
                        color:'#000',
                        fontFamily: 'Libre Franklin',
                        fontSize:'10px'
                    }
            },
            stackLabels: {
                enabled: true,
                style: {
                        fontFamily: 'Libre Franklin',
                    fontWeight: 'bold',
                    color: "#2A2A2A"
                }
            }
        },
        credits: {
                enabled: false
            },
        tooltip: {
            /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
            footerFormat: '</table> ',
            */
            useHTML: true,
            shared: true,
            formatter: function(){
                var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                $.each(this.points, function(i, point){
                    var color = point.color;
                    content += '<tr><td style="color:' + color +';padding:0; font-weight:bold;"> <b>'+ point.series.name + ' Percent : </b></td>';
                    content += '<td style="padding:0"> ' + ((point.y/point.total)* 100).toFixed(1)+ '% </td></tr>'
                })
                content += '</table>';  
                return  content;
            },
            backgroundColor: '#2A2A2A',
                style:{
                    fontFamily: 'Libre Franklin',
                    padding:'10px',
                    color: '#fff'
                },
        },
        plotOptions: {
            column: {
                    borderWidth: 0,
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: '#fff',
                    style: {
                        textShadow: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Empty',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230],
            color:'#5a5a5a'
        }, {
            name: 'Filled',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200],
            color:'#0183A5'
        }]
    });
$('#bar-graph2').highcharts(
        {
            exporting: {
            enabled: false
        },
        chart: {
            spacingTop: 30,
            backgroundColor: 'transparent',
            type: 'column',
            color: '#2A2A2A'
        },
        title: {
            text: 'UTILIZATION STATSTICS',
            style:{
                    color: '#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
        },
        xAxis: {
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            gridLineDashStyle:'dash',
            gridLineWidth: 1,
            categories: [],
            
            title: {
                text: "Floors",
                'style':
                {
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'10px'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: 90,
            itemStyle:{
                color:'#2A2A2A',
                fontStyle:'Libre Franklin',
                fontWeight:'10px'
            }
        },
        yAxis: {
            labels:{
                style:{
                    color:'#000'
                }
            },
                gridLineWidth: 1,
                gridLineDashStyle:'dash',
            min: 0,
            title: {
                text: 'SEATS',
                'style':{
                        color:'#000',
                        fontFamily: 'Libre Franklin',
                        fontSize:'10px'
                    }
            },
            stackLabels: {
                enabled: true,
                style: {
                        fontFamily: 'Libre Franklin',
                    fontWeight: 'bold',
                    color: "#2A2A2A"
                }
            }
        },
        credits: {
                enabled: false
            },
        tooltip: {
            /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
            footerFormat: '</table> ',
            */
            useHTML: true,
            shared: true,
            formatter: function(){
                var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                $.each(this.points, function(i, point){
                    var color = point.color;
                    content += '<tr><td style="color:' + color +';padding:0; font-weight:bold;"> <b>'+ point.series.name + ' Percent : </b></td>';
                    content += '<td style="padding:0"> ' + ((point.y/point.total)* 100).toFixed(1)+ '% </td></tr>'
                })
                content += '</table>';  
                return  content;
            },
            backgroundColor: '#2A2A2A',
                style:{
                    fontFamily: 'Libre Franklin',
                    padding:'10px',
                    color: '#fff'
                },
        },
        plotOptions: {
            column: {
                    borderWidth: 0,
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: '#fff',
                    style: {
                        textShadow: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Empty',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230],
            color:'#5a5a5a'
        }, {
            name: 'Filled',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200],
            color:'#0183A5'
        }]
    });
$('#bar-graph3').highcharts(
        {
            exporting: {
            enabled: false
        },
        chart: {
            spacingTop: 30,
            backgroundColor: 'transparent',
            type: 'column',
            color: '#2A2A2A'
        },
        title: {
            text: 'UTILIZATION STATSTICS',
            style:{
                    color: '#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
        },
        xAxis: {
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            gridLineDashStyle:'dash',
            gridLineWidth: 1,
            categories: [],
            
            title: {
                text: "Floors",
                'style':
                {
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'10px'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: 90,
            itemStyle:{
                color:'#2A2A2A',
                fontStyle:'Libre Franklin',
                fontWeight:'10px'
            }
        },
        yAxis: {
            labels:{
                style:{
                    color:'#000'
                }
            },
                gridLineWidth: 1,
                gridLineDashStyle:'dash',
            min: 0,
            title: {
                text: 'SEATS',
                'style':{
                        color:'#000',
                        fontFamily: 'Libre Franklin',
                        fontSize:'10px'
                    }
            },
            stackLabels: {
                enabled: true,
                style: {
                        fontFamily: 'Libre Franklin',
                    fontWeight: 'bold',
                    color: "#2A2A2A"
                }
            }
        },
        credits: {
                enabled: false
            },
        tooltip: {
            /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
            footerFormat: '</table> ',
            */
            useHTML: true,
            shared: true,
            formatter: function(){
                var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                $.each(this.points, function(i, point){
                    var color = point.color;
                    content += '<tr><td style="color:' + color +';padding:0; font-weight:bold;"> <b>'+ point.series.name + ' Percent : </b></td>';
                    content += '<td style="padding:0"> ' + ((point.y/point.total)* 100).toFixed(1)+ '% </td></tr>'
                })
                content += '</table>';  
                return  content;
            },
            backgroundColor: '#2A2A2A',
                style:{
                    fontFamily: 'Libre Franklin',
                    padding:'10px',
                    color: '#fff'
                },
        },
        plotOptions: {
            column: {
                    borderWidth: 0,
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: '#fff',
                    style: {
                        textShadow: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Empty',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230],
            color:'#5a5a5a'
        }, {
            name: 'Filled',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200],
            color:'#0183A5'
        }]
    });
$('#bar-graph4').highcharts(
        {
            exporting: {
            enabled: false
        },
        chart: {
            spacingTop: 30,
            backgroundColor: 'transparent',
            type: 'column',
            color: '#2A2A2A'
        },
        title: {
            text: 'UTILIZATION STATSTICS',
            style:{
                    color: '#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
        },
        xAxis: {
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            gridLineDashStyle:'dash',
            gridLineWidth: 1,
            categories: [],
            
            title: {
                text: "Floors",
                'style':
                {
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'10px'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: 90,
            itemStyle:{
                color:'#2A2A2A',
                fontStyle:'Libre Franklin',
                fontWeight:'10px'
            }
        },
        yAxis: {
            labels:{
                style:{
                    color:'#000'
                }
            },
                gridLineWidth: 1,
                gridLineDashStyle:'dash',
            min: 0,
            title: {
                text: 'SEATS',
                'style':{
                        color:'#000',
                        fontFamily: 'Libre Franklin',
                        fontSize:'10px'
                    }
            },
            stackLabels: {
                enabled: true,
                style: {
                        fontFamily: 'Libre Franklin',
                    fontWeight: 'bold',
                    color: "#2A2A2A"
                }
            }
        },
        credits: {
                enabled: false
            },
        tooltip: {
            /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
            footerFormat: '</table> ',
            */
            useHTML: true,
            shared: true,
            formatter: function(){
                var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                $.each(this.points, function(i, point){
                    var color = point.color;
                    content += '<tr><td style="color:' + color +';padding:0; font-weight:bold;"> <b>'+ point.series.name + ' Percent : </b></td>';
                    content += '<td style="padding:0"> ' + ((point.y/point.total)* 100).toFixed(1)+ '% </td></tr>'
                })
                content += '</table>';  
                return  content;
            },
            backgroundColor: '#2A2A2A',
                style:{
                    fontFamily: 'Libre Franklin',
                    padding:'10px',
                    color: '#fff'
                },
        },
        plotOptions: {
            column: {
                    borderWidth: 0,
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: '#fff',
                    style: {
                        textShadow: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Empty',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230],
            color:'#5a5a5a'
        }, {
            name: 'Filled',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200],
            color:'#0183A5'
        }]
    });
$('#bar-graph5').highcharts(
        {
            exporting: {
            enabled: false
        },
        chart: {
            spacingTop: 30,
            backgroundColor: 'transparent',
            type: 'column',
            color: '#2A2A2A'
        },
        title: {
            text: 'UTILIZATION STATSTICS',
            style:{
                    color: '#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'18px'
                }
        },
        xAxis: {
            labels:{
                style:{
                    color:'#2A2A2A'
                }
            },
            gridLineDashStyle:'dash',
            gridLineWidth: 1,
            categories: [],
            
            title: {
                text: "Floors",
                'style':
                {
                    color:'#2A2A2A',
                    fontFamily: 'Libre Franklin',
                    fontSize:'10px'
                }
            }
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: 90,
            itemStyle:{
                color:'#2A2A2A',
                fontStyle:'Libre Franklin',
                fontWeight:'10px'
            }
        },
        yAxis: {
            labels:{
                style:{
                    color:'#000'
                }
            },
                gridLineWidth: 1,
                gridLineDashStyle:'dash',
            min: 0,
            title: {
                text: 'SEATS',
                'style':{
                        color:'#000',
                        fontFamily: 'Libre Franklin',
                        fontSize:'10px'
                    }
            },
            stackLabels: {
                enabled: true,
                style: {
                        fontFamily: 'Libre Franklin',
                    fontWeight: 'bold',
                    color: "#2A2A2A"
                }
            }
        },
        credits: {
                enabled: false
            },
        tooltip: {
            /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
            footerFormat: '</table> ',
            */
            useHTML: true,
            shared: true,
            formatter: function(){
                var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                $.each(this.points, function(i, point){
                    var color = point.color;
                    content += '<tr><td style="color:' + color +';padding:0; font-weight:bold;"> <b>'+ point.series.name + ' Percent : </b></td>';
                    content += '<td style="padding:0"> ' + ((point.y/point.total)* 100).toFixed(1)+ '% </td></tr>'
                })
                content += '</table>';  
                return  content;
            },
            backgroundColor: '#2A2A2A',
                style:{
                    fontFamily: 'Libre Franklin',
                    padding:'10px',
                    color: '#fff'
                },
        },
        plotOptions: {
            column: {
                    borderWidth: 0,
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: '#fff',
                    style: {
                        textShadow: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Empty',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 300, 350, 230],
            color:'#5a5a5a'
        }, {
            name: 'Filled',
            maxPointWidth: 30,
            showInLegend: true,
            data: [200, 100, 50, 200],
            color:'#0183A5'
        }]
    });
    /*objd=$('#bar-graph')
    objd.css('width',600)
    objd.css('height',400)
    obj=$('.highcharts-root')
    obj[2].setAttribute('width', 600)
    obj[2].setAttribute('height', 400)*/

  $.get('http://barclaysdemo.adapptonline.com/api/utilData', function(response){
    var unusedSeats = hourSeats1 = hourSeats2 = hourSeats3 = hourSeats4 = 0;
            response.used.forEach(function(value){
                if(value == 0.000 && value < 0.166)
                    unusedSeats++;
                else if(value >= 0.166 && value <= 4)
                    hourSeats1++;
                else if(value > 4 && value <= 8)
                    hourSeats2++;
                else if(value > 8)
                    hourSeats3++;
            })
            var seatCount = response.used.length;
            var totalHours = response.totalHours;
            //console.log(seatCount);
            chart = $("#bar-graph").highcharts();
            chart.xAxis[0].setCategories(['Unused Seats', 'Seats used for 10 minutes-4 hours', 'Seats used for 4-8 hours', 'Seats used for >8 hours']);
            chart.series[0].setData([seatCount - unusedSeats, seatCount - hourSeats1, seatCount - hourSeats2, seatCount - hourSeats3])
            chart.series[1].setData([unusedSeats, hourSeats1, hourSeats2, hourSeats3])
            totalUsedHours =hourSeats1+ hourSeats2+ hourSeats3;
             /*var chart1 = $('.chart').data('easyPieChart');
             console.log(totalUsedHours)
             chart1.update(Math.round((totalHours/(38*8))*100));*/

})
function GetURLParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}
var stackLabelStyle = {
    fontFamily: 'Source-Sans-Pro-Light',
    fontWeight: 'normal',
    color: "#FFF",
    textShadow: 'none',
    fontSize: '14px'
}

var titleStyle = {
    backgroundColor: '#00937d',
    color: '#fff',
    fontFamily: 'Source-Sans-Pro-Light',
    fontSize: '18px'
}

var axisLabelStyle = {
    color: '#fff'
}
var yAxisTitleStyle = {
    color: '#fff',
    fontFamily: 'Source-Sans-Pro-Light',
    fontSize: '14px'
}

var xAxisTitleStyle = {
    color: '#fff',
    fontFamily: 'Source-Sans-Pro-Light',
    fontSize: '14px'
}

var legendStyle = {
    color: '#fff',
    fontStyle: 'Source-Sans-Pro-Light',
    fontWeight: 'normal'
}

var tooltipStyle = {
    fontFamily: 'Source-Sans-Pro-Light',
    padding: '10px',
    color: '#FFF',
    backgroundColor: '#2A2A2A',
    borderColor: '#2A2A2A'
}

var creditsData = {
    enabled: false
}

var dataLabelStyle = {
    textShadow: 'none',
    color: "#FFF"
}

var exportingData = {
    enabled: false
}

var scopeData = {
    graphTitle: '=',
    data: '=',
    graphLabels: '='
}
var newscopeData = {
    data: '='
}
var tooltipBackgroundColor = "#2A2A2A"

var tooltipBorderColor = "#2A2A2A"

var chartbackground = {
    backgroundColor: '#fff'
}

var chartcolor = {
    color: '#000'
}

Highcharts.theme = {
    colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
        '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'
    ],
    chart: {
        backgroundColor: chartbackground,
        color: chartcolor
    },
    legend: {
        itemStyle: {
            color: 'white',
            fontWeight: 'bold',
            fontFamily: 'Source-Sans-Pro-Light'
        }
    },
    title: {
        style: titleStyle
    },
    xAxis: {
        gridLineWidth: 1,
        gridLineDashStyle: 'dash',
        labels: {
            style: axisLabelStyle
        },
        title: {
            'style': xAxisTitleStyle
        }
    },
    yAxis: {
        gridLineWidth: 1,
        gridLineDashStyle: 'dash',
        labels: {
            style: axisLabelStyle
        },
        title: {
            'style': yAxisTitleStyle
        }
    },
    tooltip: {
        backgroundColor: tooltipBackgroundColor,
        borderColor: tooltipBorderColor,
        style: tooltipStyle
    },
    credits: creditsData,
}


app.directive('occupancyChart', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div style="width:100%; height:320px; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: {
                    enabled: false,
                    chartOptions: {
                        plotOptions: {
                            series: {
                                dataLabels: {
                                    enabled: true
                                }
                            }
                        }
                    },
                    scale: 3,
                    fallbackToExportServer: false
                },
                chart: {
                    renderTo: 'occupancychart',
                    type: 'areaspline'
                },

                title: {
                    text: scope.graphTitle
                },
                xAxis: {

                    title: {
                        text: 'Time(hours)'
                    },
                },
                yAxis: {
                    title: {
                        text: 'Seats Occupied'
                    },
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.13,
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: []
            });
            scope.$watchGroup(["data", "graphTitle", "graphLabels"], function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                chart.xAxis[0].setCategories(newValue[2]);
                newValue[0].forEach(function(d) {
                    chart.addSeries({
                        data: d.values,
                        name: d.name
                    })
                });
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});



app.directive('percentOccupancy', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="percentoccupancy" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: {
                    enabled: false,
                    chartOptions: { // specific options for the exported image
                        plotOptions: {
                            series: {
                                dataLabels: {
                                    enabled: true
                                }
                            }
                        }
                    },
                    scale: 3,
                    fallbackToExportServer: false
                },
                chart: {
                    renderTo: "percentoccupancy",
                    type: 'areaspline'
                },
                title: {
                    text: scope.graphTitle
                },
                xAxis: {
                    title: {
                        text: 'Time(hours)'
                    },
                    type: 'datetime',
                    dateTimeLabelFormats: {
                        hour: scope.percenthourFormat,
                        minute: scope.percentminFormat
                    }
                },
                yAxis: {
                    title: {
                        text: '% of seats Empty'
                    },
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.13,
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: []
            });
            scope.$watchGroup(["data", "graphTitle", "graphLabels"], function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                chart.xAxis[0].setCategories(newValue[2]);
                newValue[0].forEach(function(d) {
                    chart.addSeries({
                        data: d.values,
                        name: d.name
                    })
                });
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});

app.directive('seatUtilGraph', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="seatutil" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: attrs.id,
                    spacingTop: 30,
                    type: 'column',
                    color: '#222'
                },
                title: {
                    text: scope.graphTitle
                },
                xAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineWidth: 0,
                    categories: [],

                    title: {
                        text: "Hours"
                    }
                },
                legend: {
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'vertical',
                    x: 0,
                    y: 90,
                    itemStyle: legendStyle
                },
                yAxis: {

                    gridLineWidth: 0,
                    min: 0,
                    title: {
                        text: 'Seats',
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                tooltip: {
                    /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                        '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
                    footerFormat: '</table> ',
                    */
                    useHTML: true,
                    shared: true,
                    formatter: function() {
                        var content = '<table>';
                        Highcharts.each(this.points, function(i, point) {
                            var color = i.color;
                            content += '<tr><td style="color:' + color + ';padding:0; font-weight:bold;"> <b>' + (i.series.name == "Empty" ? "Remaining" : i.key) + ' Percent : </b></td>';
                            content += '<td style="padding:0"> ' + ((i.y / i.total) * 100).toFixed(1) + '% </td></tr>'
                        })
                        content += '</table>';
                        return content;
                    },
                    positioner: function() {
                        return { x: 20, y: 0 };
                    },
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                },
                plotOptions: {
                    column: {
                        borderWidth: 0,
                        stacking: 'normal',
                        dataLabels: {
                            enabled: true,
                            style: dataLabelStyle
                        }
                    }
                },
                series: []
            });
            scope.$watchGroup(["data", "graphTitle", "graphLabels"], function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                chart.xAxis[0].setCategories(newValue[2]);
                newValue[0].forEach(function(d) {
                    chart.addSeries(d)
                });
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});

app.directive('seatWiseUtilGraph', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="seatutil" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: attrs.id,
                    spacingTop: 30,
                    type: 'column',
                    color: '#222',
                    zoomType: 'x'
                },
                title: {
                    text: scope.graphTitle
                },
                xAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineDashStyle: 'dash',
                    gridLineWidth: 1,
                    categories: [],

                    title: {
                        text: ""
                    }
                },
                scrollbar: {
                    enabled: true,
                    barBackgroundColor: 'gray',
                    barBorderRadius: 7,
                    barBorderWidth: 0,
                    buttonBackgroundColor: 'gray',
                    buttonBorderWidth: 0,
                    buttonArrowColor: '#2A2A2A',
                    buttonBorderRadius: 7,
                    rifleColor: '#2A2A2A',
                    trackBackgroundColor: 'white',
                    trackBorderWidth: 1,
                    trackBorderColor: 'silver',
                    trackBorderRadius: 7
                },
                legend: {
                    align: 'center',
                    itemStyle: legendStyle
                },
                yAxis: {
                    gridLineWidth: 1,
                    gridLineDashStyle: 'dash',
                    min: 0,
                    title: {
                        text: 'Hours',
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:12px;padding:10px 0px 10px 0px">{point.key}</span><br><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:2">{series.name}: </td>' +
                        '<td style="padding:2"><b> {point.y} Hours</b></td></tr>',
                    footerFormat: '</table>',
                    useHTML: true,
                    shared: true,
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                },
                plotOptions: {
                    column: {
                        borderWidth: 0,
                        pointPadding: 0.2,
                        stacking: 'normal',
                        dataLabels: {
                            enabled: false,
                            style: dataLabelStyle
                        }
                    }
                },
                series: []
            });
            scope.$watchGroup(["data", "graphTitle", "graphLabels"], function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                chart.xAxis[0].setCategories(newValue[2]);
                if (newValue[0].length) {
                    chart.addSeries(newValue[0][0])
                    chart.xAxis[0].setExtremes(0, newValue[0][0].data.length > 30 ? 30 : newValue[0][0].data.length - 1);
                }

                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});

app.directive('maxStackChart', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="maxstack" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: "maxstack",
                    backgroundColor: chartbackground,
                    type: 'bar',
                    color: chartcolor
                },
                title: {
                    text: scope.graphTitle,
                    style: titleStyle
                },
                xAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineWidth: 0,
                    categories: [],

                    title: {
                        text: "",
                        'style': xAxisTitleStyle
                    }
                },
                yAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineWidth: 0,
                    min: 0,
                    title: {
                        text: 'Seats',
                        'style': yAxisTitleStyle
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                legend: {
                    itemStyle: legendStyle
                },
                tooltip: {
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                    /*headerFormat: '<span style="font-size:12px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:1"> {point.y/point.total} </td></tr>',
                    footerFormat: '</table>',*/
                    formatter: function() {
                        var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                        Highcharts.each(this.points, function(i, point) {
                            var color = i.color;
                            content += '<tr><td style="color:' + color + ';padding:0; font-weight:bold;"> <b>' + i.series.name + ' Percent : </b></td>';
                            content += '<td style="padding:0"> ' + ((i.y / i.total) * 100).toFixed(1) + '% </td></tr>'
                        })
                        content += '</table>';
                        return content;
                    },
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    series: {
                        stacking: 'normal',
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            style: dataLabelStyle
                        }
                    }
                },
                credits: creditsData,
                series: scope.data
            });
            scope.$watchGroup(["data", "graphTitle", "xaxisdata"], function(newValue) {
                chart.reflow();
                chart.series[0].setData(newValue[0][0].data, true);
                chart.series[1].setData(newValue[0][1].data, true);
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});

app.directive('minStackChart', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="minstack" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: "minstack",
                    backgroundColor: chartbackground,
                    type: 'bar',
                    color: chartcolor
                },
                title: {
                    text: scope.graphTitle,
                    style: titleStyle
                },
                xAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineWidth: 0,
                    categories: [],

                    title: {
                        text: "",
                        'style': xAxisTitleStyle
                    }
                },
                yAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineWidth: 0,
                    min: 0,
                    title: {
                        text: 'Seats',
                        'style': yAxisTitleStyle
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                legend: {
                    itemStyle: legendStyle
                },
                tooltip: {
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                    /*headerFormat: '<span style="font-size:12px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:1">{point.y}</td></tr>',
                    footerFormat: '</table>',*/
                    formatter: function() {
                        var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                        Highcharts.each(this.points, function(i, point) {
                            var color = i.color;
                            content += '<tr><td style="color:' + color + ';padding:0; font-weight:bold;"> <b>' + i.series.name + ' Percent : </b></td>';
                            content += '<td style="padding:0"> ' + ((i.y / i.total) * 100).toFixed(1) + '% </td></tr>'
                        })
                        content += '</table>';
                        return content;
                    },
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    series: {
                        stacking: 'normal',
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            style: dataLabelStyle
                        }
                    }
                },
                credits: creditsData,
                series: scope.data
            });
            scope.$watchGroup(["data", "graphTitle", "xaxisdata"], function(newValue) {
                chart.reflow();
                chart.series[0].setData(newValue[0][0].data, true);
                chart.series[1].setData(newValue[0][1].data, true);
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});

app.directive('bulletChart', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="bulletchart" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: "bulletchart",
                    backgroundColor: chartbackground,
                    type: 'bar',
                    color: chartcolor
                },
                title: {
                    text: scope.graphTitle,
                    style: titleStyle
                },
                xAxis: {
                    labels: {
                        style: dataLabelStyle
                    },
                    gridLineWidth: 0,
                    categories: [],

                    title: {
                        text: "",
                        'style': xAxisTitleStyle
                    }
                },
                yAxis: {
                    labels: {
                        style: dataLabelStyle
                    },
                    gridLineWidth: 0,
                    min: 0,
                    title: {
                        text: 'Seats',
                        'style': yAxisTitleStyle
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                legend: {
                    itemStyle: legendStyle
                },
                tooltip: {
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                    /*headerFormat: '<span style="font-size:12px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:1">{point.y}</td></tr>',
                    footerFormat: '</table>',*/
                    formatter: function() {
                        var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                        Highcharts.each(this.points, function(i, point) {
                            var color = i.color;
                            content += '<tr><td style="color:' + color + ';padding:0; font-weight:bold;"> <b>' + i.series.name + ' Percent : </b></td>';
                            content += '<td style="padding:0"> ' + ((i.y / i.total) * 100).toFixed(1) + '% </td></tr>'
                        })
                        content += '</table>';
                        return content;
                    },
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    series: {
                        stacking: 'normal',
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            style: dataLabelStyle
                        }
                    }
                },
                credits: creditsData,
                series: scope.data
            });
            scope.$watchGroup(["data", "graphTitle", "xaxisdata"], function(newValue) {
                chart.reflow();
                chart.series[0].setData(newValue[0][0].data, true);
                chart.series[1].setData(newValue[0][1].data, true);
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});

app.directive('barGraph', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="bargraph" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: "bargraph",
                    spacingTop: 30,
                    backgroundColor: chartbackground,
                    type: 'column',
                    color: '#222'
                },
                title: {
                    text: scope.graphTitle,
                    style: titleStyle
                },
                xAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineDashStyle: 'dash',
                    gridLineWidth: 1,
                    categories: [],

                    title: {
                        text: "Floors",
                        'style': xAxisTitleStyle
                    }
                },
                legend: {
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'vertical',
                    x: 0,
                    y: 90,
                    itemStyle: legendStyle
                },
                yAxis: {
                    labels: {
                        style: dataLabelStyle
                    },
                    gridLineWidth: 1,
                    gridLineDashStyle: 'dash',
                    min: 0,
                    title: {
                        text: 'Seats',
                        'style': yAxisTitleStyle
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                credits: creditsData,
                tooltip: {
                    /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                        '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
                    footerFormat: '</table> ',
                    */
                    useHTML: true,
                    shared: true,
                    formatter: function() {
                        var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                        Highcharts.each(this.points, function(i, point) {
                            var color = i.color;
                            content += '<tr><td style="color:' + color + ';padding:0; font-weight:bold;"> <b>' + i.series.name + ' Percent : </b></td>';
                            content += '<td style="padding:0"> ' + ((i.y / i.total) * 100).toFixed(1) + '% </td></tr>'
                        })
                        content += '</table>';
                        return content;
                    },
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                },
                plotOptions: {
                    column: {
                        borderWidth: 0,
                        stacking: 'normal',
                        dataLabels: {
                            enabled: true,
                            style: dataLabelStyle
                        }
                    }
                },
                series: scope.data
            });
            scope.$watchGroup(["data", "graphTitle", "xaxisdata"], function(newValue) {
                chart.reflow();
                chart.series[0].setData(newValue[0][0].data, true);
                chart.series[1].setData(newValue[0][1].data, true);
                chart.setTitle({ text: newValue[1] });
            }, true);
        }
    }
});


app.directive('bookUsed', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="booked" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var empdata = (scope.emp);
            var int = (scope.in);
            var outt = (scope.out);
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: 'booked',
                    backgroundColor: chartbackground,
                    type: 'column'
                },
                title: {
                    text: scope.graphTitle,
                    style: titleStyle
                },
                legend: {
                    itemStyle: legendStyle
                },
                xAxis: {
                    gridLineWidth: 1,
                    gridLineDashStyle: 'dash',
                    labels: {
                        style: axisLabelStyle
                    },
                    title: {
                        text: 'Seats',
                        'style': xAxisTitleStyle
                    },
                    categories: scope.xaxisData,
                    crosshair: true
                },
                yAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineWidth: 1,
                    gridLineDashStyle: 'dash',
                    title: {
                        text: 'Time(hours)',
                        'style': yAxisTitleStyle
                    },
                },

                tooltip: {
                    formatter: function() {
                        //var s = '<table>';
                        var s = '<span style="font-size:11px; color:#0183A5;">' + this.x + '</span><br> <table class="emp-details"><tr><th>Employee</th><th>Login</th><th>Logout</th></tr><tr><td>' + empdata + '</td><td>' + int + '</td><td>' + outt + '</td></tr></table> <table>';
                        Highcharts.each(this.points, function(i, point) {
                            s += '<tr><td style="color:' + i.series.color + ';padding:0">' + i.series.name + ': </td> <td style="padding:0"><b> ' + i.y + ' Hours</b></td></tr>';
                        });
                        s += '</table>';
                        return s;
                    },
                    shared: true,
                    useHTML: true,
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle
                },
                credits: creditsData,
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                series: scope.data
            });
            scope.$watchGroup(["data", "graphTitle", "xaxisData"], function(newValue) {
                chart.reflow();
                chart.series[0].setData(newValue[0][0].data, true);
                chart.series[1].setData(newValue[0][1].data, true);
                chart.setTitle({ text: newValue[1] });
                chart.xAxis[0].setCategories(newValue[2]);
            }, true);
        }
    }
});

app.directive('lineChart', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            data: '='
        },
        template: '<div style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: {
                    enabled: false,
                    chartOptions: {
                        plotOptions: {
                            series: {
                                dataLabels: {
                                    enabled: true
                                }
                            }
                        }
                    },
                    scale: 3,
                    fallbackToExportServer: false
                },
                chart: {
                    renderTo: attrs.id,
                    type: 'areaspline',
                    height: attrs.height
                },
                title: {
                    text: scope.xTitle
                },
                xAxis: {
                    title: {
                        text: 'Time(hours)'
                    }
                },
                yAxis: {
                    title: {
                        text: '% of seats Empty'
                    },
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.13,
                        marker: {
                            enabled: false
                        }
                    },
                    series: {
                        events: {
                            legendItemClick: function() {
                                /* scope.data.occupancy[this.index].visible = this.visible;  
                                 scope.$apply();*/
                            }
                        }
                    }
                },
                series: []
            });

            scope.$watch("data", function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                chart.xAxis[0].setCategories(newValue.labels);
                if (newValue.occupancy) {
                    newValue.occupancy.forEach(function(d) {
                        chart.addSeries({
                            data: d.values,
                            name: d.name,
                            visible: d.visible
                        })
                    });
                }

                chart.setTitle({ text: newValue.title });
                chart.xAxis[0].setTitle({ text: newValue.xTitle });
                chart.yAxis[0].setTitle({ text: newValue.yTitle });
            }, true);
        }
    }
});

app.directive('buildBarGraph', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div id="bargraph" style="width:100%; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: exportingData,
                chart: {
                    renderTo: "bargraph",
                    spacingTop: 30,
                    backgroundColor: chartbackground,
                    type: 'column',
                    color: '#222'
                },
                title: {
                    text: scope.graphTitle,
                    style: titleStyle
                },
                xAxis: {
                    labels: {
                        style: axisLabelStyle
                    },
                    gridLineDashStyle: 'dash',
                    gridLineWidth: 1,
                    categories: [],

                    title: {
                        text: "Floors",
                        'style': xAxisTitleStyle
                    }
                },
                legend: {
                    align: 'right',
                    verticalAlign: 'top',
                    layout: 'vertical',
                    x: 0,
                    y: 90,
                    itemStyle: legendStyle
                },
                yAxis: {
                    labels: {
                        style: dataLabelStyle
                    },
                    gridLineWidth: 1,
                    gridLineDashStyle: 'dash',
                    min: 0,
                    title: {
                        text: 'Seats',
                        'style': yAxisTitleStyle
                    },
                    stackLabels: {
                        enabled: true,
                        style: stackLabelStyle
                    }
                },
                credits: creditsData,
                tooltip: {
                    /*headerFormat: '<span style="font-size:12px"><b>{point.key}</b></span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0; font-weight: bold;"> {series.name}:  </td>' +
                        '<td style="padding:0"> {point.y}/{point.stackTotal}</td></tr>',
                    footerFormat: '</table> ',
                    */
                    useHTML: true,
                    shared: true,
                    formatter: function() {
                        var content = '<span style="font-size:12px"><b>' + this.x + '</b></span><table>';
                        Highcharts.each(this.points, function(i, point) {
                            var color = i.color;
                            content += '<tr><td style="color:' + color + ';padding:0; font-weight:bold;"> <b>' + i.series.name + ' Percent : </b></td>';
                            content += '<td style="padding:0"> ' + ((i.y / i.total) * 100).toFixed(1) + '% </td></tr>'
                        })
                        content += '</table>';
                        return content;
                    },
                    backgroundColor: tooltipBackgroundColor,
                    borderColor: tooltipBorderColor,
                    style: tooltipStyle,
                },
                plotOptions: {
                    column: {
                        borderWidth: 0,
                        stacking: 'normal',
                        dataLabels: {
                            enabled: true,
                            style: dataLabelStyle,
                            stack: 'normal'
                        }
                    }
                },
                series: scope.data
            });
        }
    }
});

app.directive('columnChart', function(){
    return {
        restrict: 'E',
        replace: true,
        // scope: scopeData,
        template: '<div id="columnChart" style="width:100%; position:relative">not working</div>',
         link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: {
                    enabled: false
                },
                chart: {
                    type: 'column',
                     renderTo: "columnChart"
                },
                title: {
                    text: 'Power Consumed'
                },
                // subtitle: {
                //     text: 'Click the columns to view versions. Source: <a href="http://netmarketshare.com">netmarketshare.com</a>.'
                // },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    title: {
                        text: 'Total power consumed'
                    }

                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            format: '{point.y:.1f}%'
                        }
                    }
                },

                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
                },

                series: [{
                    name: 'Usage',
                    colorByPoint: true,
                    data: [{
                        name: 'Level 2',
                        y: 100
                       
                    }]
                }],
            });
        }
    }
});

app.directive('seatBargraph', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div style="width:100%; height:320px; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                exporting: {
                    enabled: false,
                    chartOptions: {
                        plotOptions: {
                            series: {
                                dataLabels: {
                                    enabled: true
                                }
                            }
                        }
                    },
                    scale: 3,
                    fallbackToExportServer: false
                },
                chart: {
                    renderTo: 'barchart',
                    type: 'bar'
                },

                title: {
                    text: scope.graphTitle
                },
                xAxis: {
                    title: {
                        text: 'Floors'
                    },


                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Seat Allocation'
                    }
                },
                legend: {
                    reversed: true
                },
                plotOptions: {
                    series: {
                        stacking: 'normal'
                    },
                    bar: {
                        fillOpacity: 0.13,
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: [],
            });
           scope.$watch("data", function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                chart.xAxis[0].setCategories(newValue.labels);
                if (newValue.barData) {
                    newValue.barData.forEach(function(d) {
                        chart.addSeries({
                            data: d.values,
                            name: d.name
                        })
                    });
                }

                chart.setTitle({ text: newValue.title });
                // chart.xAxis[0].setTitle({ text: newValue.xTitle });
                // chart.yAxis[0].setTitle({ text: newValue.yTitle });
            }, true);
        }
    }
});


app.directive('donutChart', function($timeout) {
    return {
        restrict: 'E',
        replace: true,
        scope: scopeData,
        template: '<div style="width:100%; height:280px; position:relative">not working</div>',
        link: function(scope, element, attrs) {
            var chart = new Highcharts.Chart({
                colors: ["#0183A5", "#FF8000"],
                exporting: {
                    enabled: false,
                    chartOptions: {
                        plotOptions: {
                            series: {
                                dataLabels: {
                                    enabled: true
                                }
                            }
                        }
                    },
                    scale: 3,
                    fallbackToExportServer: false
                },
                chart: {
                    renderTo: attrs.id,
                    plotBackgroundColor: null,
                    plotBorderWidth: 0,
                    plotShadow: false
                },

                title: {
                    text:scope.graphTitle
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                },
                xAxis: {
                    categories: ['Level1', 'Level2', 'Level3', 'Level4', 'Level5'],
                    title: {
                        text: 'Floors'
                    },
                },
                plotOptions: {
                    pie: {
                        dataLabels: {
                            enabled: true,
                            distance: -50,
                            style: {
                                fontWeight: 'bold',
                                color: 'white'
                            }
                        },
                        startAngle: -180,
                        endAngle: 180,
                        center: ['50%', '50%']
                    }
                },
                series: []
            });
            scope.$watch("data", function(newValue) {
                while (chart.series.length > 0) {
                    chart.series[0].remove(true);
                }
                chart.reflow();
                if (newValue.donutData) {
                    newValue.donutData.forEach(function(d) {
                        chart.addSeries({
                            type:d.type,
                            innerSize:d.innerSize,
                            data: d.values,
                            name: d.name
                        })
                    });
                }

                chart.setTitle({ text: newValue.title });
                $timeout(function(){
                    chart.reflow();
                },1000);
            }, true);
        }
    }
});

Highcharts.setOptions(Highcharts.theme);
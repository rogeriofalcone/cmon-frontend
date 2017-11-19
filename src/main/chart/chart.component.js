(function () {
    'use strict';

    angular
        .module('cc.main.chart', [])
        .controller('ChartController', ChartController)
        .component('ccChart', {
            bindings: {
                // options: '<',
                clusterId: '@',
                hostId: '@?',
                name: '@?',
                chartType:'@',
                statType: '@',
                fields: '@?',
                startDate: '@',
                endDate: '@?',
            },
            templateUrl: 'main/chart/chart.html',
            controller: 'ChartController as vm',
        });

    /**
     * @ngInject
     */
    function ChartController(
        $scope,
        $element,
        Ws,
        Highcharts
    ) {
        const vm = this;

        vm.$onInit = $onInit;

        /**
         * @desc Initialize component controller
         */
        function $onInit() {
            const ws = new Ws(buildUrl());

            // Handle socket errors
            ws.on('error', console.error);

            // Disconnect the socket when the $scope is destroyed
            $scope.$on('$destroy', () => ws.disconnect());

            // Handle initial chart data
            ws.on('init', (data) => {
                // Try to parse JSON
                try {
                    data = JSON.parse(data);
                } catch (e) { throw e; }

                let series = [];

                // Create data series from backend data
                vm.fields
                    .split(',')
                    .forEach((field) => {
                        data[field].sort(sortMethod);
                        series.push({
                            name: field,
                            data: data[field],
                        });
                    });

                // Render chart
                vm.chart = new Highcharts.Chart({
                    width:1000,
                    chart: {
                        renderTo: $element[0],
                        type: vm.chartType,
                        defaultSeriesType: 'spline',
                    },
                    title: {
                        text: vm.name || 'Unknown',
                    },
                    xAxis: {
                        type: 'datetime',
                        // tickPixelInterval: 150,
                        // maxZoom: 20 * 1000
                    },
                    yAxis: {
                        // minPadding: 0.2,
                        // maxPadding: 0.2,
                        title: {
                            text: 'Bytes',
                            // margin: 80
                        }
                    },
                    series: series,
                });
            });

            // Handle update chart data
            ws.on('point', (data) => {
                // Try to parse JSON
                try {
                    data = JSON.parse(data);
                } catch (e) { throw e; }

                // Add new points to chart
                angular.forEach(data, (points, k) => {
                    vm.chart.series.forEach((serie) => {
                        if (serie.name == k) {
                            points.sort(sortMethod);
                            points.forEach((point) => serie.addPoint(point))
                        }
                    });
                });
            });
        }

        /**
         * @desc This method is user to sort the incomming data array
         * @param {array} a 
         * @param {array} b 
         * @returns {number}
         * @private
         */
        function sortMethod(a, b) {
            return a[0] - b[0];
        }

        /**
         * @desc Builds socket url
         * @returns {string}
         * @private
         */
        function buildUrl() {
            let url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/socket/stat?';
            let params = {
                cid: vm.clusterId,
                type: vm.statType,
                from: vm.startDate,
            };
            if (vm.hostId) {
                params.hid = vm.hostId;
            }
            if (vm.fields) {
                params.fields = vm.fields;
            }
            if (vm.endDate && vm.endDate !== '') {
                params.to = vm.endDate;
            }
            return url + Object.keys(params)
                .map((key) => `${key}=${encodeURIComponent(params[key])}`)
                .join('&');
        }
    }

}());
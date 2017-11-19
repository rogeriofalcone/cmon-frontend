(function () {

    angular
        .module('cc.main.dashboard', [])
        .controller('DashboardController', DashboardController)
        .component('ccDashboard', {
            templateUrl: 'main/dashboard/dashboard.html',
            controller: 'DashboardController as vm',
        });

    /**
     * @desc Dashboard controller
     * @ngInject
     */
    function DashboardController(
        $q,
        ClustersService,
        AlarmsService
    ) {
        const vm = this;

        // vm variables
        vm.loading = true;
        vm.clusters = [];
        vm.alarms = [];

        // vm methods
        vm.$onInit = $onInit;

        /**
         * @desc Initialize component controller
         * @private
         */
        function $onInit() {
            let queueList = [];

            queueList.push(
                ClustersService
                    .list()
                    .then((clusters) => vm.clusters = clusters)
                    .catch(console.error)
            );

            queueList.push(
                AlarmsService
                    .list()
                    .then((alarms) => vm.alarms = alarms)
                    .then(() => console.log(vm.alarms))
                    .catch(console.error)
            );

            $q.all(queueList).finally(() => vm.loading = false);
        }
    }

})();
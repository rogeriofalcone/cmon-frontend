(function () {

    angular
        .module('cc.main.clusters.hostDetails', [])
        .controller('HostDetailsController', HostDetailsController)
        .component('ccHostDetails', {
            bindings: {
                clusterId: '@',
                hostId: '@',
            },
            templateUrl: 'main/clusters/hostDetails/hostDetails.html',
            controller: 'HostDetailsController as vm',
        });

    /**
     * @ngInject
     */
    function HostDetailsController(
        serverTime
    ) {
        const vm = this;

        vm.statMemStartTime = serverTime() - (60*60);
    }

}());
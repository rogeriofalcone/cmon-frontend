(function () {

    angular
        .module('cc.main.clusters.clusterDetails', [])
        .controller('ClusterDetailsController', ClusterDetailsController)
        .component('ccClusterDetails', {
            bindings: {
                clusterId: '@',
            },
            templateUrl: 'main/clusters/clusterDetails/clusterDetails.html',
            controller: 'ClusterDetailsController as vm',
        });

    /**
     * 
     * @ngInject
     */
    function ClusterDetailsController(
        ClustersService
    ) {
        const vm = this;

        vm.loading = true;
        vm.cluster = null;

        vm.$onInit = $onInit;

        function $onInit() {
            ClustersService
                .get(vm.clusterId)
                .then((cluster) => vm.cluster = cluster)
                .catch(console.error)
                .finally(() => vm.loading = false);
        }
    }

})();
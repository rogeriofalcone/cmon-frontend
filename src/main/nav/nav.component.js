(function () {

    angular
        .module('cc.main.nav', [])
        .controller('NavController', NavController)
        .component('ccNav', {
            templateUrl: 'main/nav/nav.html',
            controller: 'NavController as vm',
        });

    /**
     * @ngInject
     */
    function NavController(
        ClustersService
    ) {
        const vm = this;

        vm.$onInit = $onInit;

        function $onInit() {
            ClustersService
                .list()
                .then((clusters) => vm.clusters = clusters)
                .catch(console.error);
        }

    }

})();
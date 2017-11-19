(function () {

    angular
        .module('cc.main')
        .config(config);

    /**
     * @ngInject
     */
    function config(
        $stateProvider,
        $urlRouterProvider,
        $locationProvider
    ) {
        // Use html5mode
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false,
        });

        // Set default route
        $urlRouterProvider.otherwise('/');

        // Set states
        $stateProvider
            .state({
                name: 'dashboard',
                url: '/',
                default: true,
                component: 'ccDashboard',
            })
            .state({
                name: 'cluster',
                url: '/cluster/:clusterId',
                component: 'ccClusterDetails',
                resolve: {
                    clusterId: resolveClusterId,
                },
            })
            .state({
                name: 'host',
                url: '/cluster/:clusterId/host/:hostId',
                component: 'ccHostDetails',
                resolve: {
                    clusterId: resolveClusterId,
                    hostId: resolveHostId,
                },
            });

        /**
         * @param $stateParams 
         * @ngInject
         */
        function resolveClusterId($stateParams) {
            return $stateParams.clusterId;
        }

        /**
         * @param $stateParams  
         * @ngInject
         */
        function resolveHostId($stateParams) {
            return $stateParams.hostId;
        }
    }

})();
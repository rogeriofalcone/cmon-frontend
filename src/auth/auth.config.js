(function () {

    angular
        .module('cc.auth')
        .config(config);

    /**
     * @desc Auth app configuration
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
        $stateProvider.state({
            name: 'auth',
            url: '/',
            default: true,
            component: 'ccAuth',
        });
    }

})();
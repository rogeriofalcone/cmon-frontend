/**
 * @desc Auth Component
 * @namespace Components
 */
(function () {

    angular
        .module('cc.auth.login')
        .component('ccAuth', {
            templateUrl: 'auth/login/login.html',
            controller: 'LoginController as vm',
        });

})();
/**
 * @desc Auth Component Controller
 * @namespace Controllers
 */
(function () {

    angular
        .module('cc.auth.login')
        .controller('LoginController', LoginController);

    /**
     * @param {AuthService} AuthService
     * @ngInject
     */
    function LoginController(AuthService) {
        const vm = this;

        // vm variables
        vm.loading = false;
        vm.error = null;

        // vm methods
        vm.$onInit = $onInit;
        vm.onSubmit = onSubmit;

        ////////////////////

        function $onInit() {
        }

        /**
         * @desc Handle form submit
         */
        function onSubmit() {
            vm.loading = true;
            AuthService
                .login(vm.user.login, vm.user.password)
                .then(() => location.reload(true))
                .catch((err) => {
                    vm.error = err.message;
                    vm.loading = false;
                });
        }
    }

})();
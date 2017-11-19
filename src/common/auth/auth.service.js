/**
 * @desc Auth Service
 * @namespace Services
 */
(function () {

    angular
        .module('cc.common.auth')
        .service('AuthService', service);

    /**
     * @desc AuthService wrapper
     * @ngInject
     */
    function service(
        $q,
        $http
    ) {

        AuthService.prototype.login = login;
        AuthService.prototype.logout = logout;

        return new AuthService();

        /**
         * @desc AuthService class
         * @constructor
         */
        function AuthService() { }

        /**
         * @desc Authenticate with the backend
         * @param {string} userName 
         * @param {string} password 
         * @returns {$q.Promise<User>}
         * @this {AuthService}
         */
        function login(userName, password) {
            return $q((resolve, reject) => {
                $http
                    .post('/json/auth/login', {
                        user_name: userName,
                        password: password,
                    })
                    .then((response) => {
                        const data = response.data || { error_string: 'unknown auth error' };
                        if (data.error_string) {
                            reject(new Error(data.error_string));
                        } else {
                            resolve(data.user);
                        }
                    })
                    .catch(reject);
            });
        }

        function logout() {
            $http
                .post('/json/auth/logout')
                .finally(() => location.reload(true));
        }

    }

})();
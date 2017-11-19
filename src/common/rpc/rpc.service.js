/**
 * @desc RPC Service
 * @namespace Services
 */
(function () {

    /**
     * @desc List of supported Rpc modules
     * @enum {string}
     */
    const RpcModules = {
        Auth: 'auth',
        Alarm: 'alarm',
        Users: 'users',
        Backup: 'backup',
        Clusters: 'clusters',
        Host: 'host',
        Stat: 'stat',
        Jobs: 'jobs',
        Maintenance: 'maintenance',
        Metatype: 'metatype',
        Config: 'config',
        Process: 'process',
        Log: 'log',
        Imperative: 'imperative',
        Discovery: 'discovery',
    };

    angular
        .module('cc.common.rpc')
        .constant('RpcModules', RpcModules)
        .service('RpcService', service);

    /**
     * @desc RpcService wrapper
     * @ngInject
     */
    function service(
        $q,
        $http,
        AuthService
    ) {

        // RpcService
        RpcService.prototype.Auth = new SubService(RpcModules.Auth);
        RpcService.prototype.Alarm = new SubService(RpcModules.Alarm, 'alarms');
        RpcService.prototype.Users = new SubService(RpcModules.Users);
        RpcService.prototype.Backup = new SubService(RpcModules.Backup);
        RpcService.prototype.Clusters = new SubService(RpcModules.Clusters, 'clusters');
        RpcService.prototype.Host = new SubService(RpcModules.Host);
        RpcService.prototype.Stat = new SubService(RpcModules.Stat);
        RpcService.prototype.Jobs = new SubService(RpcModules.Jobs);
        RpcService.prototype.Maintenance = new SubService(RpcModules.Maintenance);
        RpcService.prototype.Metatype = new SubService(RpcModules.Metatype);
        RpcService.prototype.Config = new SubService(RpcModules.Config);
        RpcService.prototype.Process = new SubService(RpcModules.Process);
        RpcService.prototype.Log = new SubService(RpcModules.Log);
        RpcService.prototype.Imperative = new SubService(RpcModules.Imperative);
        RpcService.prototype.Discovery = new SubService(RpcModules.Discovery);

        // SubService
        SubService.prototype.request = request;

        return new RpcService();

        /**
         * @desc RpcService class
         * @constructor
         */
        function RpcService() { }

        /**
         * @desc RpcService sub-service class
         * @param {string} module RPC Module to call
         * @param {string} param A param to search for in the response
         * @constructor
         * @private
         */
        function SubService(module, param) {
            this.module = module;
            this.param = param;
        }

        /**
         * @desc Make an RPC request to CMON
         * @param {string} operation 
         * @param {object} data 
         * @returns {$q.Promise}
         * @this {RpcService}
         * @public
         */
        function request(operation, data) {
            return $q((resolve, reject) => {
                const req = Object.assign({}, data || {}, { operation: operation });
                $http
                    .post('/rpc/' + this.module, req)
                    .then((response) => {
                        const data = response.data || { error_string: 'uknown rpc error' };
                        if (data.request_status === 'AuthRequired') {
                            AuthService.logout();
                            return;
                        }
                        resolve(data[this.param] ? data[this.param] : data);
                    })
                    .catch(reject);
            });
        }

    }

})();
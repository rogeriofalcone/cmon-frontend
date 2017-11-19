(function () {

    angular
        .module('cc.main.stats')
        .service('StatsService', service)

    /** @ngInject */
    function service(
        RpcService
    ) {


        Stream.prototype.onUpdate = onUpdate;

        ///////////////////////////////////////////////////////

        const clusterStats = {};
        const hostStats = {};

        return new StatsService();

        /**
         * @desc Statistical service
         * @constructor
         */
        function StatsService() { }

        function Stream(type, dateFrom, clusterId, hostId) {
            this.type = type;
            this.handlers = [];
        }

        function onUpdate(handler) {
            this.handlers.push(handler);
            return this;
        }

    }

}());
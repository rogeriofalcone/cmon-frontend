/**
 * @desc Common Module
 * @namespace Modules
 */
(function () {

    angular
        .module('cc.common', [
            'cc.common.auth',
            'cc.common.rpc',
        ]);

})();
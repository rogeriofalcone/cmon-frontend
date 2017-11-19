/**
 * @desc Main module
 * @namespace Modules
 */
(function () {

    angular
        .module('cc.main', [
            // vendors
            'ui.router',

            // shared
            'cc.common',

            // subs
            'cc.main.nav',
            'cc.main.templates',
            'cc.main.chart',
            'cc.main.alarms',
            'cc.main.stats',
            'cc.main.clusters',
            'cc.main.users',
            'cc.main.dashboard',
            'cc.main.websocket',
        ]);

})();

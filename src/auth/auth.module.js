/**
 * @desc Auth module
 * @namespace Modules
 */
(function () {

    angular
        .module('cc.auth', [
            'ui.router',
            'cc.common',
            'cc.auth.templates',
            'cc.auth.login',
        ]);

})();
(function () {
    'use strict';

    angular
        .module ('cc.main.clusters.hostTag',[])
        .component ('ccHostTag',{
            bindings: {
                'host': '<',
            },
            controllerAs:'vm',
            templateUrl: 'main/clusters/hostTag/hostTag.html',
        });

} ());
(function () {

    angular
        .module('cc.main.alarms')
        .service('AlarmsModels', service)

    /** @ngInject */
    function service(
        Model
    ) {

        class Alarm extends Model {
            get __define() {
                return {};
            }

            /**
             * @desc Returns alarm severity text
             * @returns {string}
             */
            getSeverityText() {
                switch (this.severity_name) {
                    case 'ALARM_WARNING':
                        return 'warning';
                    case 'ALARM_CRITICAL':
                        return 'critical';
                    default:
                        return 'unknown';
                }
            }
        }

        return {
            Alarm: Alarm,
        };

    }

}());
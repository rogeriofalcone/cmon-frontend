(function () {

    angular
        .module('cc.main.alarms')
        .service('AlarmsService', service)

    /** @ngInject */
    function service(
        $q,
        $http,
        $timeout,
        AlarmsModels,
        WebsocketService
    ) {

        // AlarmsService
        AlarmsService.prototype.list = list;

        // AlarmsList
        AlarmsList.prototype = [];
        AlarmsList.prototype.update = update;
        AlarmsList.prototype.remove = remove;
        AlarmsList.prototype.getByAlarmId = getByAlarmId;
        AlarmsList.prototype.hasAlarm = hasAlarm;
        AlarmsList.prototype.getAlarmIndex = getAlarmIndex;

        ///////////////////////////////////

        const alarmsList = new AlarmsList();
        const alarmsService = new AlarmsService();

        // Listen to alarm events in websocket
        WebsocketService.onCmonEvent('EventAlarm', (event) => {
            console.log('EVENT', event);
            const alarm = event.event_specifics.alarm;
            const status = event.event_name;

            // Take different actions depending on alarm status
            switch (status) {
                // Update the list if alarm is created or changed
                case 'Changed':
                case 'Created':
                    $timeout(() => alarmsList.update([alarm]));
                    break;
                // Remove from list if the alarm is ended
                case 'Ended':
                    $timeout(() => alarmsList.remove([alarm]));
                    break;
            }
        });

        return alarmsService;

        /**
         * @desc Alarms service
         */
        function AlarmsService() {
            this.alarmsListLoaded = false;
            this.list();
        }

        /**
         * @desc Contains all the alarms
         * @extends {Array}
         */
        function AlarmsList() {
            Array.apply(this, arguments);
        }

        /**
         * @desc Fetch alarms list from backend
         * @returns {$q.Promise<Alarm[]>}
         * @this {AlarmsService}
         * @public
         */
        function list() {
            // Return alarms list from cache if already loaded
            if (this.alarmsListLoaded === true) {
                return $q.resolve(alarmsList);
            }
            this.alarmsListLoaded = true;

            // Load alarms list from backend
            // using an aggregator method since RPC can only reply
            // with alarms list per cluster and not by multiple clusters
            return $q((resolve, reject) => {
                $http
                    .get('/json/alarms/all')
                    .then((r) => alarmsList.update(r.data))
                    .then(() => {
                        this.alarmsListLoaded = true;
                        resolve(alarmsList);
                    })
                    .catch(reject);
            });
            return this;
        }

        /**
         * @desc Update the alarms list
         * @param {array} alarms 
         * @returns {AlarmsList}
         * @this {AlarmsList}
         * @public
         */
        function update(alarms) {
            alarms.forEach((alarm) => {
                if (this.hasAlarm(alarm.alarm_id)) {
                    const a = this.getByAlarmId(alarm.alarm_id);
                    if (a !== undefined) {
                        a.update(alarm);
                    }
                } else {
                    this.push(new AlarmsModels.Alarm(alarm));
                }
            });
            return this;
        }

        /**
         * @desc Remove alarm/s from list
         * @param {array} alarms 
         * @returns {AlarmsList}
         * @this {AlarmsList}
         * @public
         */
        function remove(alarms) {
            alarms.forEach((alarm) => {
                const index = this.getAlarmIndex(alarm.alarm_id);
                if (index >= 0) {
                    this.splice(index, 1);
                }
            });
            return this;
        }

        /**
         * @desc Returns an alarm by alarm id or undefined
         * @param {number} alarmId 
         * @returns {Alarm}
         * @this {AlarmsList}
         * @public
         */
        function getByAlarmId(alarmId) {
            const alarms = this.filter((a) => a.alarm_id == alarmId);
            return alarms.length === 1 ? alarms[0] : undefined;
        }

        /**
         * @desc Returns alarm index in list
         * @param {number} alarmId
         * @returns {number}
         * @this {AlarmsList}
         * @public
         */
        function getAlarmIndex(alarmId) {
            for (var i = 0; i < this.length; i++) {
                if (this[i].alarm_id === alarmId) {
                    return i;
                }
            }
            return -1;
        }

        /**
         * @desc Returns true if an alarm exists in list
         * @param {number} alarmId
         * @returns {boolean}
         * @this {AlarmsList}
         * @public
         */
        function hasAlarm(alarmId) {
            return this.getByAlarmId(alarmId) !== undefined;
        }
    }

}());
(function () {

    angular
        .module('cc.main.websocket', [])
        .service('WebsocketService', service);

    /**
     * @ngInject
     */
    function service(
        Ws
    ) {

        WebsocketService.prototype.on = on;
        WebsocketService.prototype.onCmonEvent = onCmonEvent;

        const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/socket';
        const socket = new Ws(url);

        return new WebsocketService();

        /**
         * @constructor
         * @property {{*:Function[]}} handlers
         */
        function WebsocketService() {
            this.handlers = {};
            this.cmonEventHandlers = {};

            // Trigger cmon events
            this.on('cmon_event', (event) => {
                if (this.cmonEventHandlers.hasOwnProperty(event.event_class)) {
                    this.cmonEventHandlers[event.event_class]
                        .forEach((handler) => handler(event));
                }
            });

            const trigger = (eventName, eventData) => {
                if (this.handlers.hasOwnProperty(eventName)) {
                    this.handlers.forEach((handler) => {
                        handler(eventData);
                    });
                }
            };
        }

        /**
         * @desc Add an event handler
         * @param {string} eventName 
         * @param {function} eventHandler 
         * @returns {WebsocketService}
         * @this {WebsocketService}
         * @public
         */
        function on(eventName, eventHandler) {
            socket.on(eventName, (event) => {
                try {
                    event = JSON.parse(event);
                } catch (e) { }
                eventHandler(event);
            });
            return this;
        }

        function onCmonEvent(filter, handler) {
            if (!this.cmonEventHandlers.hasOwnProperty(filter)) {
                this.cmonEventHandlers[filter] = [];
            }
            this.cmonEventHandlers[filter].push(handler);
            return this;
        }

    }

})();
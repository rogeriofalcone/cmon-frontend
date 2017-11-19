/**
 * @desc Main Module Constants
 * @namespace Constants
 */
(function (window) {

    angular
        .module('cc.main')
        .constant('version', version)
        .constant('serverTime', serverTime)
        .constant('Ws', Ws)
        .constant('Highcharts', window.Highcharts);

    /**
     * @desc A wrapper for golang Ws javascript library
     * @todo Move this declaration to a separate file
     * @constructor
     */
    function Ws() {
        this.$$connected = false;
        this.$$ws = new window.Ws(...arguments);

        // When connection is established
        this.$$ws.OnConnect(() => {
            this.$$connected = true;
        });

        // When disconnected
        this.$$ws.OnDisconnect(() => {
            delete this.$$ws;
            this.$$connected = false;
        });
    }

    /**
     * @desc On socket event
     * @returns {Ws}
     * @this {Ws}
     * @public
     */
    Ws.prototype.on = function () {
        this.$$ws.On(...arguments);
        return this;
    };

    /**
     * @desc Disconnect from a socket
     * @returns {Ws}
     * @this {Ws}
     * @public
     */
    Ws.prototype.disconnect = function () {
        this.$$ws.Disconnect();
        delete this.$$ws;
        return this;
    };

})(window);
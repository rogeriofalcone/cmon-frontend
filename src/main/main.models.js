(function () {

    class Model {

        get __define() {
            throw new Error('__define not implemented');
        }

        constructor(data) {
            this.update(data);
        }

        /**
         * @desc Update model fields
         * @param {object} data 
         * @memberof Model
         */
        update(data) {
            // Assign data to model
            Object
                .assign(this, data || {});

            // Assign sub-models
            Object
                .keys(this)
                .forEach((key) => {
                    if (key in this.__define) {
                        if (this[key] instanceof Array) {
                            this[key] = this[key].map((item) => new this.__define[key](item));
                        } else {
                            this[key] = new this.__define[key](this[key]);
                        }
                    }
                });
        }

    }

    angular
        .module('cc.main')
        .constant('Model', Model);

})();
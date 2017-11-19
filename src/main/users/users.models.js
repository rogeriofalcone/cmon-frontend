(function () {

    angular
        .module('cc.main.users')
        .service('UsersModels', service);

    /**
     * @ngInject
     */
    function service(
        Model
    ) {

        class User extends Model {
            get __define() {
                return {
                    groups: UserGroup,
                };
            }

            constructor(data) {
                super(data);
            }
        }

        class UserGroup extends Model {
            get __define() {
                return {};
            }
        }

        return {
            User: User,
            UserGroup: UserGroup,
        };

    }

})();
(function () {

    angular
        .module('cc.main.clusters')
        .service('ClustersModels', service);

    /**
     * @ngInject
     */
    function service(
        Model,
        UsersModels
    ) {

        class Cluster extends Model {
            get __define() {
                return {
                    hosts: Host,
                    owner: UsersModels.User,
                    group_owner: UsersModels.UserGroup,
                };
            }

            getId() {
                return this.cluster_id;
            }
        }

        class Host extends Model {
            get __define() {
                return {}
            }

            isController() {
                return this.nodetype === 'controller';
            }
        }

        return {
            Cluster: Cluster,
            Host: Host,
        };
    }

})();
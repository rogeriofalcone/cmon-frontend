(function () {

    angular
        .module('cc.main.clusters')
        .service('ClustersService', service)

    /** @ngInject */
    function service(
        $q,
        RpcService,
        ClustersModels
    ) {
        let cachedClusters = [];

        ClustersService.prototype.list = list;
        ClustersService.prototype.get = get;

        return new ClustersService();

        /**
         * @constructor
         */
        function ClustersService() { }

        /**
         * @desc List all clusters
         * @returns {$q.Promise<Cluster[]>}
         * @this {ClustersService}
         * @public
         */
        function list() {
            return $q((resolve, reject) => {
                // Returns clusters from cache
                if (cachedClusters.length > 0) {
                    resolve(cachedClusters);
                    return;
                }
                // Load clusters from backend
                RpcService
                    .Clusters
                    .request('getAllClusterInfo', {
                        with_hosts: true,
                        with_sheet_info: true,
                    })
                    .then((clusters) => {
                        cachedClusters = clusters.map(toCluster);
                        resolve(cachedClusters);
                    })
                    .catch(reject);
            });
        }

        /**
         * @desc Returns a cluster by id
         * @param {number} id 
         * @returns {$q.Promise<Cluster>}
         * @this {ClustersService}
         * @public
         */
        function get(id) {
            return $q((resolve, reject) => {
                this
                    .list()
                    .then((clusters) => {
                        let c = clusters.filter((cluster) => cluster.getId() === parseInt(id));
                        if (c.length === 1) {
                            resolve(c[0]);
                        } else {
                            reject(new Error(`cluster ${id} not found`));
                        }
                    })
                    .catch(reject);
            });
        }

        /**
         * @desc Convert object to Cluster model
         * @param {object} cluster 
         * @returns {Cluster}
         * @private
         */
        function toCluster(cluster) {
            return new ClustersModels.Cluster(cluster);
        }

    }

}());
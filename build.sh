#!/usr/bin/env bash

# exit on first error
set -e

# app versions
dir=`pwd`
mainVersion=$(cat version)
buildVersion=$1
installDir=/

# clean previous builds
rm -rf dist

# build frontend
npm install   || (echo 'failed to install npm dependensies'; exit 1)
npm run build || (echo 'failed to build frontend'; exit 1)
# npm test      || (echo 'frontend unit tests failed'; exit 1)

# build backend
# go test ./...
CGO_ENABLED=1 \
GOOS=linux \
go build \
    -a \
    -ldflags "-X main.buildVersion=${buildVersion} -X main.mainVersion=${mainVersion} -linkmode external -extldflags -static" \
    -installsuffix cgo .
[ $? != "0" ] && echo 'failed to build backend app' && exit 1

# create deb package
rm -rf _CPack_Packages CMakeCache.txt
cmake . \
    -DCMAKE_INSTALL_PREFIX=${installDir} \
    -DBUILDNUM=${buildVersion} \
    -DCPACK_GENERATOR=DEB
[ $? != "0" ] && echo "cmake deb build failed" && exit
make package
[ $? != "0" ] && echo "make deb failed" && exit


# create rpm package
rm -rf _CPack_Packages CMakeCache.txt
cmake . \
    -DCMAKE_INSTALL_PREFIX=${installDir} \
    -DBUILDNUM=${buildVersion} \
    -DCPACK_GENERATOR=RPM
[ $? != "0" ] && echo "cmake rpm build failed" && exit
make package
[ $? != "0" ] && echo "make rpm failed" && exit

# Move packages
mkdir -p build
[ -f ${dir}/cmon-ssh ] && mv ${dir}/cmon-ssh ${dir}/build/
[ -f ${dir}/clustercontrol_${mainVersion}-${buildVersion}_x86_64.deb ] && mv ${dir}/clustercontrol_${mainVersion}-${buildVersion}_x86_64.deb ${dir}/build/
[ -f ${dir}/clustercontrol-${mainVersion}-${buildVersion}-x86_64.rpm ] && mv ${dir}/clustercontrol-${mainVersion}-${buildVersion}-x86_64.rpm ${dir}/build/

# Clean
rm -rf \
    _CPack_Packages \
    CMakeFiles \
    CMakeCache.txt \
    cmake_install.cmake \
    CPackConfig.cmake \
    CPackSourceConfig.cmake \
    install_manifest.txt \
    Makefile
#!/usr/bin/env bash

yum clean all

# Install wget
echo "Installing wget"
yum -y install wget

# Setup repositories
echo "Setting up repositories"
rpm --import http://repo.severalnines.com/severalnines-repos.asc
wget http://severalnines.com/downloads/cmon/s9s-repo.repo -P /etc/yum.repos.d/
wget http://repo.severalnines.com/s9s-tools/CentOS_7/s9s-tools.repo -P /etc/yum.repos.d/

# Install mysqld


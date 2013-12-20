#!/bin/sh

#INSTALLPATH=/opt/edgeletsapi/
INSTALLPATH=$PWD/

#. ${INSTALLPATH}api.conf
[ $# -eq 0 ] && echo "missing configuration file" && exit;

case $1 in
  /*) file=$1;;
  *) file=$PWD/$1;;
esac

[ ! -f $file ] && echo "configuration file $file doesn't exist" && exit;
. $file

NODE_PATH=$NODE_PATH $NODE_EXE ${INSTALLPATH}api.js --port=$NODE_PORT --user=$USERNAME --pwd=$PASSWORD --base=$BASE_URL --masterip=$BASE_IP --path=${INSTALLPATH}

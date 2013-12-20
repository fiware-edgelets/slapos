if [[ $EUID -ne 0 ]]; then
  echo "must be run as root"
  exit 1
fi

mkdir -p /opt/edgeletsapi
cp api.conf /opt/edgeletsapi/api.conf
ln -fs /home/tai/newapi/edgelets-api.sh /usr/bin/edgeletsapi ## A CHANGER 
cp /home/tai/newapi/edgelets-api /etc/init.d/edgeletsapi ## a changer itou
chmod +x /etc/init.d/edgeletsapi

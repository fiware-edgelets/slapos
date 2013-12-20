# quick and dirty way to request a software release, must be migrated to python calls

if [ -z "$1" ]; then
  echo "ERROR"
  exit
fi
if [ -z "$2" ]; then
  echo "ERROR"
  exit
fi

SUPPLY=`echo "supply(\"$1\", \"$2\")" | slapos console slaposconsole.cfg`

echo "{\"status\": \"Installation requested\"}"

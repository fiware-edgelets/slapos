# quick and dirty way to request a software release, must be migrated to python calls

if [ -z "$1" ]; then
  echo "ERROR"
  exit
fi
if [ -z "$2" ]; then
  echo "ERROR"
  exit
fi
if [ -z "$3" ]; then
  echo "ERROR"
  exit
fi

SUPPLY=`echo "request(\"$1\", \"$2\", filter_kw={ \"computer_guid\": \"$3\" })" | slapos console slaposconsole.cfg`

#echo "$SUPPLY" | grep Traceback>/dev/null
#if [ $? -ne 0 ]; then
#  echo "ERROR"
#  echo "$SUPPLY"
#else
#  echo "OK"
#fi

echo "{\"status\": \"Instanciation requested\"}"

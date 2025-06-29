clear

# what environment
echo ""
echo "*****************************************************"
echo "PACKRAT: PREPARING FOR DEPLOYMENT"
echo "*****************************************************"
echo "[1] Production"
echo "[2] Staging"
echo "[q] Quit"
echo ""
read -p "What environment: " CHOICE

# determine the suffix
case $CHOICE in
	1)
		SUFFIX="-prod"
		ENVIRONMENT="Production"
	;;
	2) 
		SUFFIX="-dev"
		ENVIRONMENT="Staging"
	;;
	*)
		echo "Exiting..."
		exit 1;
	;;
esac

echo "you have selected the $ENVIRONMENT environment."

# what containers do we operate on
CONTAINERS=("packrat-server" "packrat-client")
# "packrat-solr")

# stop, delete containers
for CONTAINER in "${CONTAINERS[@]}"; do
	NAME="$CONTAINER$SUFFIX"
	echo "Cleaning up container: $NAME"
	docker stop "$NAME"
	docker rm "$NAME"
done
docker container prune

# prune images
echo "Removing images..."
docker image prune -f

# extra cleanup of images
if [ "$ENVIRONMENT" == "Production" ]; then
	echo "Cleaning Production images"
	docker rmi $(docker images -q packrat-server-prod)
	docker rmi $(docker images -q packrat-client-prod)
elif [ "$ENVIRONMENT" == "Staging" ]; then
	echo "Cleaning Staging images"
	docker rmi $(docker images -q packrat-server-dev)
	docker rmi $(docker images -q packrat-client-dev)
fi

# remove solr
if [ "$ENVIRONMENT" == "Staging" ]; then
	echo "Removing Solr...(remember to rebuild index)"
	docker stop packrat-solr-dev
	docker rm packrat-solr-dev
fi 

# remove build cache
if [ "$ENVIRONMENT" == "Staging" ]; then
        echo "Removing Docker Build Cache..."
	docker builder prune -a -f
fi

# fix our TMPDIR
read -p "What user to use for temp files: " TMP_USER
echo "Fixing TMPDIR and mount..."
export TMPDIR=/home/$TMP_USER/tmp
sudo mount /tmp -o remount,exec

echo "Done"

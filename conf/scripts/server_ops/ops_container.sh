# TODO: use 'select' statement to provide choices and options/looping

ARG1="$1"

main() {

	clear 
	echo "*****************************************************"
	echo "PACKRAT: CONTAINER OPS"
	echo "*****************************************************"
	echo "[1] Stop Container(s)"
	echo "[2] Start Container(s)"
	echo "[3] Restart Container(s)"
	echo "[4] Restart Service"
	echo "[5] Service Status"
	echo "[6] Reclaim Space"
	echo "[q] Quit"
	echo ""
	read -p "What do you want to do: " ACTION_ID
	
	# if no container then exit
        if [ -z "$ACTION_ID" ]; then
		exit 1
	elif (($ACTION_ID==q)); then
		exit 1
	fi

	# if astart/stop/restart then just set flag, else execute
	case "$ACTION_ID" in
		1) ACTION="stop"
		;;
		2) ACTION="start"
		;;
		3) ACTION="restart"
		;;
		4) ACTION="service"
			clear 
			echo "*****************************************************"
			echo "PACKRAT: RESTARTING DOCKER SERVICE"
			echo "*****************************************************"
			echo "restarting service..."			
			sudo systemctl restart docker
			echo "done"
			exit 1
		;;
		5) ACTION="service_status"
			clear 
			echo "*****************************************************"
			echo "PACKRAT: DOCKER SERVICE STATUS"
			echo "*****************************************************"
			sudo systemctl status docker
			exit 1
		;;
		6) ACTION="reclaim_space"
			clear
		 	echo "*****************************************************"
                        echo "PACKRAT: DOCKER CLEANING UP UNUSED RESOURCES"
                        echo "*****************************************************"
			echo ""
			echo "----------------------------------------------------"
			echo "space use: pre-cleanup"
			echo "----------------------------------------------------"
			docker system df
			echo ""
			echo "----------------------------------------------------"
			echo "pruning system. this may take a few minutes..."
			echo "----------------------------------------------------"
                        sudo docker container prune -f
			sudo docker image prune -a -f
			sudo docker volume prune -f
			sudo docker system prune -a -f
			echo ""
			echo "----------------------------------------------------"
			echo "space use: after cleanup"
			echo "----------------------------------------------------"
			docker system df
			echo "----------------------------------------------------"
			exit 1
		;;	
	esac
	
	# what environment
	echo ""
	echo "*****************************************************"
	echo "PACKRAT: "$ACTION"ING CONTAINER"
	echo "*****************************************************"
	echo "[1] Production"
	echo "[2] Staging"
	echo ""
	read -p "What environment: " ENVIRONMENT

	# if nothing bail
	if [ -z "$ENVIRONMENT" ]; then
		exit 1
	fi
	
	# what container to start
	FILTER=""
	echo ""
	echo "*****************************************************"
	if (($ENVIRONMENT==1)); then
		FILTER="-prod$"
	else
		FILTER="-dev$"
	fi
	docker ps -a -f name="$FILTER"
	echo ""
	read -p "What container ID (empty to abort): " CONTAINER_ID

	# if no container then exit
        if [ -z "$CONTAINER_ID" ]; then
		exit 1
	fi

	# what action
	echo ""
	echo "*****************************************************"
	echo "$ACTION: $CONTAINER_ID..."	

	docker $ACTION $CONTAINER_ID

	echo "Done"
}

main


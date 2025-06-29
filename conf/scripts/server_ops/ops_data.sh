ARG1="$1"

main() {

	clear
	echo "*****************************************************"
	echo "PACKRAT: TRANSIENT DATA OPS"
	echo "*****************************************************"
	# TODO: support transient & persistent operations

        # what environment
	if [[ -z "$ARG1" ]]; then
		echo ""
		echo "[1] Production"
		echo "[2] Staging"
		echo ""											                
		read -p "What environment: " ENVIRONMENT									
	else
		ENVIRONMENT="$ARG1"
		echo "Environment: $ARG1"
	fi

	# build our path
	case "$ENVIRONMENT" in
		1) DATA_PATH="/data/Packrat/Storage/Staging/*" ;;
		2) DATA_PATH="/data/Packrat/Storage-Dev/Staging/*" ;;
		3) echo "Invalid option. exiting..." 
			exit 1
		;;
	esac

	# what action
	echo ""
	echo "[1] Clear"
	echo ""
	read -p "What action: " ACTION
	case "$ACTION" in
		1) echo "Clearing transient data..."
			rm -rf $DATA_PATH
		;;
		*) echo "Invalid option. exiting..."
			exit 1
		;;
	esac
}

main

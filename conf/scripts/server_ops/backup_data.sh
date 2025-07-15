ARG1="$1"

main() {

	clear
	echo "*****************************************************"
	echo "PACKRAT: STORAGE DATA"
	echo "*****************************************************"

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

	ROOT_PATH="/3ddigip01/Packrat"

	if (($ENVIRONMENT==1)); then
		SRC_PATH="$ROOT_PATH/Storage/Repository/"
		DST_PATH="$ROOT_PATH/Backups/Repository/Production/"
	else
		SRC_PATH="$ROOT_PATH/Storage-Dev/Repository/"
		DST_PATH="$ROOT_PATH/Backups/Repository/Staging/"
	fi

	echo ""
	echo "*****************************************************"
	echo "Syncing with backup folder..."
	rsync -ah --info=progress2 $SRC_PATH $DST_PATH
}

time main

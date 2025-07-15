main() {

	clear
	echo "*********************************************"
	echo "PACKRAT: MIGRATION"
	echo "*********************************************"
	echo ""
	echo "[1] Full"
	echo "[2] Only Models"
	echo "[3] Only Scenes"
	echo ""
	read -p "What should we run: " ACTION

	case "$ACTION" in
		1) echo "Running a FULL migration..."
			curl https://packrat-test.si.edu:8443/server/migrate
		;;
		2) echo "Migrating only MODELS..."
			curl https://packrat-test.si.edu:8443/server/migrate/models
		;;
		3) echo "Migrating only SCENES..."
		       curl https://packrat-test.si.edu:8443/server/migrate/scenes
		;;
		*) echo "Invalid option. exiting..."
			exit 1
		;;
 	esac

	echo "This process will take a LONG time. You can check on progress via generated logs."
}

main

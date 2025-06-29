ARG1="$1"

main() {

	clear
	echo "*****************************************************"
	echo "PACKRAT: BUILD DATABASE"
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

	case "$ENVIRONMENT" in
		1) DATABASE="PackratProduction"
			SQL_PATH="/data/Packrat/Code/dpo-packrat/server/db/sql/scripts"
		;;
		2) DATABASE="PackratStaging"
			SQL_PATH="/data/Packrat/Code/dpo-packrat/server/db/sql/scripts"
		;;
		*) echo "Invalid option. existing..."
			exit 1
		;;
	esac

	# what action
	echo ""
	echo "[1] Drop"
	echo "[2] Build"
	echo ""
	read -p "What action: " ACTION
	case "$ACTION" in
		1) echo "Dropping database..."
			mysql --database=$DATABASE --default-character-set=utf8mb4 < "$SQL_PATH/Packrat.DROP.sql"
		;;
		2) echo "Building database..."
		    mysql --database=$DATABASE --default-character-set=utf8mb4 < "$SQL_PATH/Packrat.SCHEMA.sql"
	       	mysql --database=$DATABASE --default-character-set=utf8mb4 < "$SQL_PATH/Packrat.PROC.sql"
	      	mysql --database=$DATABASE --default-character-set=utf8mb4 < "$SQL_PATH/Packrat.DATA.sql"
		;;
 		*) echo "Invalid option. exiting..."
			exit 1
		;;		
	esac
}

main

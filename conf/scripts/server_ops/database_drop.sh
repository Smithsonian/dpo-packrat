ARG1="$1"

main() {

	clear
	echo "*****************************************************"
	echo "PACKRAT: DROP DATABASE"
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

	if (($ENVIRONMENT==1)); then
		DATABASE="PackratProduction"
		DROP_SCRIPT="/data/Packrat/Code/dpo-packrat/server/db/sql/scripts/Packrat.DROP.sql
	else
		DATABASE="PackratStaging"
		DROP_SCRIPT="/data/Packrat/Code-Dev/dpo-packrat/server/db/sql/scripts/Packrat.DROP.sql
	fi


	echo ""
	echo "dropping database..."
	mysql -database="$DATABASE" -default-character-set=utf8mb4 < "$DROP_SCRIPT"
}

main

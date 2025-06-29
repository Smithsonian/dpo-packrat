# This script automates creation of production and staging database backups
main() {
	clear
	echo "*********************************************"
	echo "PACKRAT: BACKUP"
	echo "*********************************************"

	DATA_PATH="/3ddigip01/Packrat/Backups/Database"
	TIMESTAMP=$(date +"%F_%H-%M-%S")
	STAGING_FILENAME="$DATA_PATH/PackratStaging.$TIMESTAMP".sql
	PRODUCTION_FILENAME="$DATA_PATH/PackratProduction.$TIMESTAMP".sql 

	echo "backing up database...Staging"
	mysqldump --routines --skip-lock-tables --user=packrat --password=vY66ttjD5bMESG66Yay2qV511QQIFguvSzDqMG7 --result-file=$STAGING_FILENAME PackratStaging
	echo "backing up database...Production"
	mysqldump --routines --skip-lock-tables --user=packrat --password=vY66ttjD5bMESG66Yay2qV511QQIFguvSzDqMG7 --result-file=$PRODUCTION_FILENAME PackratProduction

	DATE=$(date -u +"%Y-%m-%d")
	YEAR=$(date -u +"%Y")
	ARCHIVE_FILENAME="$DATA_PATH/$YEAR/Packrat_DB-Backup_$DATE".zip

	mkdir -p "$DATA_PATH/$YEAR"

	echo "compressing backups..."
	zip $ARCHIVE_FILENAME $STAGING_FILENAME $PRODUCTION_FILENAME
	
	echo "applying permissions..."
	chown root:packrat-admin $ARCHIVE_FILENAME
	chmod 760 $ARCHIVE_FILENAME

	echo "cleaning up..."
	rm $STAGING_FILENAME
	rm $PRODUCTION_FILENAME
}

time main

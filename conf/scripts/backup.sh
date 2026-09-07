# This script automates creation of production and staging database backups
# cron expects this script at /data/Packrat/Backups/Scripts/backup.sh

# Remove old backups
find /data/Packrat/Backups/Data -mmin +5 -type f -delete

TIMESTAMP=`date '+%F_%H-%M-%S'`

mysqldump --routines --skip-lock-tables --user=packrat --password=FILL_ME_IN --result-file=/data/Packrat/Backups/Data/PackratStaging.$TIMESTAMP.sql PackratStaging
mysqldump --routines --skip-lock-tables --user=packrat --password=FILL_ME_IN --result-file=/data/Packrat/Backups/Data/PackratProduction.$TIMESTAMP.sql PackratProduction

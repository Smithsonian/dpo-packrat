# Creates and seeds the packrat db

docker run --name packrat-devbox-db -p 3306:3306 -v ${PWD}/server/db/sql:/app --env-file ./.env.dev -itd mariadb:10.5

SQL_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env.dev | cut -d '=' -f2)

docker exec -i packrat-devbox-db sh -c "mysql -u root -p$SQL_PASSWORD -e 'CREATE DATABASE IF NOT EXISTS Packrat'"
docker exec -i packrat-devbox-db sh -c "mysql -u root -p$SQL_PASSWORD < /app/scripts/Packrat.SCHEMA.sql"
docker exec -i packrat-devbox-db sh -c "mysql -u root -p$SQL_PASSWORD < /app/scripts/Packrat.PROC.sql"
docker exec -i packrat-devbox-db sh -c "mysql -u root -p$SQL_PASSWORD < /app/scripts/Packrat.DATA.sql"

echo "Done"
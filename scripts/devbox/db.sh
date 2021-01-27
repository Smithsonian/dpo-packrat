# Creates and seeds the packrat db

IMAGE=mariadb:10.5
PACKRAT_WORKDIR=/app

docker run --name packrat-db -p 3306:3306 -v ${PWD}/server/db/sql:${PACKRAT_WORKDIR} --env-file ./.env.dev -itd $IMAGE

SQL_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env.dev | cut -d '=' -f2)

docker exec -i packrat-db sh -c "mysql -u root -p$SQL_PASSWORD < /app/scripts/Packrat.SCHEMA.sql"
docker exec -i packrat-db sh -c "mysql -u root -p$SQL_PASSWORD < /app/scripts/Packrat.PROC.sql"
docker exec -i packrat-db sh -c "mysql -u root -p$SQL_PASSWORD < /app/scripts/Packrat.DATA.sql"

echo "Successful"
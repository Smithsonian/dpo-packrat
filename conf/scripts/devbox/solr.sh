# Devbox for Packrat

# Run node docker image and map port 8983 for access to solr
docker run --name packrat-devbox-solr -p 8983:8983 -v ${PWD}/server/config/solr/data/:/var/solr/data/ --env-file ./.env.dev -itd solr:8

echo "Done"
## COPY --chown=solr:solr ./server/config/solr/data/ /var/solr/data/

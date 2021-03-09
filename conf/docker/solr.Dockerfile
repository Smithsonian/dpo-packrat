FROM solr:8 as solr
COPY --chown=solr:solr ./server/config/solr/data/packrat/ /var/solr/data/packrat/

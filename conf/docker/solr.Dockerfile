FROM solr:8 as solr
COPY --chown=solr:solr ./server/config/solr/data/packrat/ /var/solr/data/packrat/
COPY --chown=solr:solr ./server/config/solr/data/packratMeta/ /var/solr/data/packratMeta/
COPY --chown=solr:solr ./server/config/solr/etc/default/solr.in.sh /etc/default/solr.in.sh
RUN chmod 755 /etc/default/solr.in.sh


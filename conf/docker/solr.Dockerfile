FROM solr:10 as solr
COPY --chown=solr:solr ./server/config/solr/data/packrat/ /var/solr/data/packrat/
COPY --chown=solr:solr ./server/config/solr/data/packratMeta/ /var/solr/data/packratMeta/
COPY --chown=solr:solr ./server/config/solr/etc/default/solr.in.sh /etc/default/solr.in.sh
RUN chmod 755 /etc/default/solr.in.sh

# Solr 10's launcher defaults to SolrCloud mode and aborts without a ZooKeeper config.
# Packrat runs a single standalone node, so force user-managed (standalone) mode. The
# base image ENTRYPOINT is docker-entrypoint.sh, which forwards this CMD to
# `solr start -f --user-managed` via solr-foreground.
CMD ["solr-foreground", "--user-managed"]


SOLR_JAVA_MEM="-Xms4096m -Xmx4096m"
SOLR_HOST_BIND="0.0.0.0"

# Core config (conf/, core.properties) is baked into the image under SOLR_HOME
# (/var/solr/data). Index and tlog are written under SOLR_DATA_HOME instead, so the
# rebuildable Lucene data can live on its own persistent volume separate from config.
SOLR_DATA_HOME="/var/solr/index"
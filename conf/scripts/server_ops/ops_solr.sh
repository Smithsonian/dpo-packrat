ARG1="$1"

main() {

	clear
	echo "****************************************************"
	echo "PACKRAT: SOLR OPS"
	echo "****************************************************"
	echo ""
	echo "[1] Clear"
	echo "[2] Re-index"
	echo ""
	read -p "What action: " ACTION

	case "$ACTION" in
		1) echo "Clearing Solr index..."
			curl http://localhost:8983/solr/packrat/update --data "<delete><query>*:*</query></delete>" -H "Content-type:text/xml; charset=utf-8"
			curl http://localhost:8983/solr/packrat/update --data "<commit/>" -H "Content-type:text/xml; charset=utf-8"
			curl http://localhost:8983/solr/packratMeta/update --data "<delete><query>*:*</query></delete>" -H "Content-type:text/xml; charset=utf-8"
			curl http://localhost:8983/solr/packratMeta/update --data "<commit/>" -H "Content-type:text/xml; charset=utf-8"
		;;
		2) echo "Re-Indexing Solr..."
			curl https://packrat-test.si.edu:8443/server/solrindex
		;;
		*) echo "Invalid option. exiting..."
			exit 1
		;;
	esac
}

main


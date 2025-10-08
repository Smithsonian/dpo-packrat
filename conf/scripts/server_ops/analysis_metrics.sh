main() {

	ROOT_PATH="./"
	#3ddigip01/Packrat/Storage/Repository"
	EXTENSIONS="obj|glb|giltf|ply|stl|fbx"
	FILES=`find $ROOT_PATH -type f -regextype posix-egrep -regex ".*($EXTENSIONS)" -printf '%TY-%Tm-%Td\n' | sort | uniq -c | awk '{$1=$1};1'`
	
	echo "$FILES"
	#find $ROOT_PATH -regextype posix-egrep -regex ".*(${EXTENSIONS})" -printf '%TY-%Tm-%Td\n' | sort | uniq -c | awk '{$1=$1};1' > rate.txt
}
main

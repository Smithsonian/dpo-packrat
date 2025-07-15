# TODO: diagnostic to see if remounting is needed.

ARG1="$1"

main() {

	clear 
	echo "*****************************************************"
	echo "PACKRAT: CONTAINER OPS"
	echo "*****************************************************"
	echo "[1] Remount Repository"
	echo "[2] Process Info"
	echo "[3] Disk Performance"
	echo "[q] Quit"
	echo ""
	read -p "What do you want to do: " ACTION_ID
	
	# if no action id then exit
        if [ -z "$ACTION_ID" ]; then
		exit 1
	elif (($ACTION_ID==q)); then
		exit 1
	fi

	# handle each action
	case "$ACTION_ID" in
		1) ACTION="remount"
			clear 
			echo "*****************************************************"
			echo "PACKRAT: REMOUNTING REPOSITORY"
			echo "*****************************************************"
			echo "unmounting /3ddigip01..."
			umount -l /3ddigip01
			echo "mounting /3ddigip01..."
			mount si-ocio-qnas2.si.edu:/si-3ddigi-staging /3ddigip01
			echo "done"
		;;
		2) ACTION="process"
			clear
			echo "*****************************************************"
                        echo "SYSTEM: PROCESS INFORMATION"
                        echo "*****************************************************"
			# todo: if no argument passed in ask for id after listing them
			if [ -z "$ARG1" ]; then
				echo "need to pass in PID as an argument"
				echo ""
				ps -Ao user,uid,comm,pid,pcpu,tty,args --sort=-pcpu | head -n 6
				exit 1
			fi
			ps -p $ARG1 -o pid,vsz=MEMORY -o user,group=GROUP -o comm,args=ARGS
			echo ""
		;;
		3) ACTION="disk"
			clear
			echo "*****************************************************"
			echo "SYSTEM: DISK PERFORMANCE (3ddigip01)"
			echo "*****************************************************"
			echo "[1] 10G"
			echo "[2] 100G"
			echo "[3] 1TB"
			echo "[b] Back"
			echo ""

			read -p "Select test size: " SIZE_OPTION
			case "$SIZE_OPTION" in
				1) BS=10M; COUNT=1024 ;;         # 10G
				2) BS=100M; COUNT=1024 ;;        # 100G
				3) BS=1G; COUNT=1024 ;;          # 1TB
				b|B) main; return ;;             # Go back to main menu
				*) echo "Invalid size option"; exit 1 ;;
			esac

			echo "testing write speeds (${COUNT} x ${BS})"
			sudo dd if=/dev/zero of=/3ddigip01/samplefile bs=$BS count=$COUNT oflag=direct

			echo "testing read speeds (${COUNT} x ${BS})"
			sudo dd if=/3ddigip01/samplefile of=/dev/null bs=$BS count=$COUNT iflag=direct

			echo "cleaning up..."
			sudo rm -rf /3ddigip01/samplefile
			sudo rm -rf /data/samplefile
		;;
		*) echo "Invalid option"
			exit 1
		;;
	esac
}

main

# dpo-packrat
Data Repository and Workflow Management for 3D data captures, models, and scenes

## Setup instructions (Development):

*Note: `.env.dev` is required and it follows `.env.template`*

### Development:

#### Prerequisites:
It is recommended to install [Volta](https://volta.sh/) which keeps node version in check. The versions can be specified in `package.json` and when switched to the directory of the project, volta automatically switches to the correct node version.

```
cd ~
curl https://get.volta.sh | bash
volta install node
volta install yarn
```
Now when you switch to the `dpo-packrat` repo, your node version would automatically pinned to the correct version by volta.


1. Install the dependencies:

``` 
yarn
```

2. Build the docker images, if they're already available then this would just start them (if you're on a mac then make sure Docker for mac is running):

``` 
yarn dev
```

3. Now the docker containers should start in 10s-20s. The client should be reachable at `http://localhost:3000` and server should be reachable at `http://localhost:4000` or the ports you specified in `.env.dev` following `.env.template`

4. If you want to follow debug logs for `client` or `server` container then just run `yarn log:client` or `yarn log:server`

5. If not using docker run each command in a separate terminal for the package you're developing:

**For client:**

``` 
yarn start:client
``` 

**For server:**

```
yarn start:server
``` 

# Alternative docker workflow:

```
# Creates Devbox for packrat
yarn devbox:up
# Creates DB for devbox
yarn devbox:db
# Creates SOLR for devbox
yarn devbox:solr
# Create and Connects devbox-db, devbox-solr, and devbox to the same network
yarn devbox:network
# Drops you into shell inside the image
yarn devbox:start
```

*Note: if you get permission denied during the execution make sure to give it permission using:*
```
chmod 777 ./conf/scripts/devbox/*.sh
```

# Deployment instructions:
*Note: Make sure before you execute any script, you're root of the repository `dpo-packrat` and if you get permission denied for any script, make sure to do `chmod 777 path/to/script`. If you encounter any error then make sure to checkout Packrat server setup instruction on confluence*

## Docker images:
*Note: current supported environments are `dev` and `prod`*

1. Login into SI server

2. Pull the latest changes
```
git pull
```
*Note: repository is already cloned in `/home/<user>/dpo-packrat`*

3. Switch to the branch you want to deploy. To deploy for `dev` environment you should be on `develop` branch, for `prod` environment
```
git checkout master
```
*Note: `.env.dev` and `.env.prod` are already available*

4. Deploy using the `deploy.sh` script
```
./conf/scripts/deploy.sh prod
```
If you get `permission denied for docker` then use
```
sudo chmod 777 /var/run/docker.sock
```
If you get `Error while loading shared libraries: libz.so.1` for `docker-compose` then do the following:
```
sudo mount /tmp -o remount,exec
```

5. Wait for the images to be build/updated, then use `./conf/scripts/cleanup.sh` script to cleanup any residual docker images are left (optional)

6. Make sure nginx is active using `sudo service nginx status --no-pager`

## Start databases (Production server only):

1. Start `dev` or `prod` databases using `./conf/scripts/initdb.sh` script
```
MYSQL_ROOT_PASSWORD=<your_mysql_password> ./conf/scripts/initdb.sh dev
```
*Note: `MYSQL_ROOT_PASSWORD` be same what you mentioned in the `.env.dev` or `.env.prod` file for that particular environment. Mostly would be used for `dev` environment.*

## Update production nginx configuration (Production server only):

1. Make the changes to production nginx configuration is located at `scripts/proxy/nginx.conf`

2. Use `conf/scripts/refreshProxy.sh` script to restart/update nginx service
```
./conf/scripts/refreshProxy.sh
```

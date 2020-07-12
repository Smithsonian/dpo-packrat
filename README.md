# dpo-packrat
Data Repository and Workflow Management for 3D data captures, models, and scenes

## Instructions:

*`.env` is required and it follows `.env.template`*

### Development:

1. Install the dependencies:

``` 
yarn
```

2. Build existing packages:

``` 
yarn build
```

3. Build the docker images, if they're already available then this would just start them (if you're on a mac then make sure Docker for mac is running):

``` 
yarn dev
```

4. Now the docker containers should start in 10s-20s. The client should be reachable at `http://localhost:3000` and server should be reachable at `http://localhost:4000` or the ports you specified in `.env` following `.env.template`

5. If you want to follow debug logs for `client` or `server` container then just run `yarn log:client` or `yarn log:server`

6. If you're developing `common` package then make sure to use `yarn start:common` so that it's actively watched/compiled and made available to other packages it's imported at. The other packages should auto reload when changes are made to them.

7. If not using docker run each command in a separate terminal for the package you're developing:

**For client:**

``` 
yarn start:client
``` 

**For server:**

```
yarn start:server
``` 

**For common:**

```
yarn start:common
``` 

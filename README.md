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

3. Compose and build the docker images, if they're already available then this would just start them (make sure docker desktop is running):

``` 
yarn compose:dev
```

4. Start up client and server in dev mode:

**Client:**

``` 
yarn dev:client
``` 

You should be inside the `packrat-client` docker image now

```
yarn start:client
```

Client should be reachable at `http://localhost:3000`

**Server:**

``` 
yarn dev:server
``` 

You should be inside the `packrat-server` docker image now

```
yarn start:server
```

Server should be reachable at `http://localhost:4000`

**Common:** (not required)

If you're developing `common` package then make sure to use `yarn start:common` so that it's actively watched/compiled and made available to other packages it's imported at. The other packages should auto reload when changes are made to them.

```
yarn start:common
``` 

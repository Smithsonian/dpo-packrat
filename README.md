# dpo-packrat
Data Repository and Workflow Management for 3D data captures, models, and scenes

## Instructions:

*`.env` is required and it follows `.env.template`*

### Development:

1. Install the dependencies

``` 
yarn
```

2. Build existing packages

``` 
yarn build
```

3. Start docker shell

``` 
yarn dev
```

4. Now while in docker shell run these command to start whatever package you're developing (run each command in a separate terminal if developing more than 1 packages):

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

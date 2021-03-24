import { IAuth, VerifiedUser } from '../interface';
import { Config } from '../../config';
import ldap = require("ldapjs");

class LDAPAuth implements IAuth {
  async verifyUser(email: string, password: string): Promise<VerifiedUser> {
      let ldapServer: string = Config.ldap.server;
      let serviceAccount: string = Config.ldap.serviceAccount;
      let secret: string = Config.ldap.password;

      let res: VerifiedUser = {user: null, error: null};

      //Step 1: Create a ldap client using server address
      let client = ldap.createClient({
          url: ldapServer
      });

      //Step 2: Bind Packrat Service Account
      let serviceBind: Promise<void> = new Promise<void>(function(resolve, reject)
      {
        client.bind('CN=' + serviceAccount + ',OU=Service Accounts,OU=Enterprise,DC=US,DC=SINET,DC=SI,DC=EDU', secret, (err: any): void =>
        {
          if(err)
          {
            reject(err);
          }
          else
          {
            resolve();
          }
        });
      });

      let failCheck: boolean = true;

      await serviceBind.catch((err: any) => {
        failCheck = false;
        res = {user: null, error: err};
      });

      serviceBind.then(() => {
      });

      if(!failCheck)
      {
        return res;
      }

      //LDAP Search Options
      const opts = {
        filter: '(mail=' + email + ')', // (Searches on mail value)
        scope: 'sub',
        paged: true,
        sizeLimit: 1, //return only one result
        attributes: ['cn'] //return cn value
      };

      let DN: string = ""; //DN used to bind user
      let user: any = {}; //User to return (Might need to change depending...)
      let searchComplete: boolean = false;

      //Step 3: Search for passed user by email
      let searchPromise: Promise<any> = new Promise<any>(function(resolve, reject)
      {
        client.search("DC=US,DC=SINET,DC=SI,DC=EDU", opts, (err:any, res:any): void => {
          if(err)
          {
              console.log(err.message);
          }

          res.on('searchEntry', (entry: any) => {
            user = entry;
            searchComplete = true;
            resolve(entry.objectName);
          });

          res.on('error', (err: any) =>
          {
            reject(err);
          });

          res.on('end', (result: any) =>
          {
            if(!searchComplete)
            {
              reject("User not found: " + JSON.stringify(result));
            }
          });
        });
      });

      await searchPromise.catch((err: any) => {
        failCheck = false;
        res = {user: null, error: err};
      });

      if(!failCheck)
      {
        return res;
      }

      await searchPromise.then((response: any) => {
        DN = response;
      });

      //Step 4: If user is found, bind on their credentials
      let userBind: Promise<void> = new Promise<void>(function (resolve, reject)
      {
        client.bind(DN, password, (err:any): void => {
          if(err)
          {
            reject(err);
          }
          else
          {
            resolve();
          }
        });
      });

      await userBind.catch((err: any) => {
        failCheck = false;
        res = {user: null, error: err};
      });

      if(!failCheck)
      {
        return res;
      }

      await userBind.then(() => {
        res = { user: user, error: null };
      });

      return res;
    }
}

export default LDAPAuth;

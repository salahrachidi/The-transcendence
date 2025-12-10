import vault from 'node-vault';

let vaultClient;

async function initVaultClient() {

  const roleId = process.env.VAULT_ROLE_ID;
  const secretId = process.env.VAULT_SECRET_ID;
  
  const tempClient = vault({
    endpoint: 'https://vault:8200',
    requestOptions: {
      strictSSL: false
    }
  });

  const result = await tempClient.approleLogin({
    role_id: roleId,
    secret_id: secretId
  });

  vaultClient = vault({
    endpoint: 'https://vault:8200',
    requestOptions: {
      strictSSL: false
    },
    token: result.auth.client_token 
  });
  // console.log(vaultClient);
  return vaultClient;
}

async function getSecrets(path) {

  const result = await vaultClient.read(path);
  
  // Result structure:
  // {
  //   data: {
  //     data: {
  //       API_KEY: "production-api-key-12345",
  //       DATABASE_PASSWORD: "prod-db-pass-67890",
  //       JWT_SECRET: "prod-jwt-secret-abcdef"
  //     },
  //     metadata: {
  //       version: 1,
  //       created_time: "2025-12-06T10:00:00Z"
  //     }
  //   }
  // }
  
  return result.data.data;
}

async function initVault() {

  await initVaultClient();
  const secrets = await getSecrets('secret/data/descendence/env');
  Object.assign(process.env, secrets)
}

export default initVault;
import { Amplify } from "aws-amplify";
import { SignInOutput, fetchAuthSession, signIn } from "@aws-amplify/auth";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const AWS_REGION = "eu-west-2";
const USER_POOL_ID = "eu-west-2_qcrsl8aSb";
const IDENTITY_POOL_ID = "eu-west-2:1501a893-c1d4-464b-b680-938dcac7faff";
const USER_POOL_CLIENT_ID = "14pf06359tmc6sg9rb6uh0h2ml";

Amplify.configure({
  Auth: {
    // extract these value from the UI
    Cognito: {
      userPoolId: USER_POOL_ID,
      userPoolClientId: USER_POOL_CLIENT_ID,
      identityPoolId: IDENTITY_POOL_ID,
    },
  },
});

export class AuthServices {
  public async login(userName: string, password: string) {
    const signInOutput: SignInOutput = await signIn({
      username: userName,
      password: password,
      options: {
        authFlow: "USER_PASSWORD_AUTH",
      },
    });
    return signInOutput;
  }

  public async getIdToken() {
    // grabs JWT token
    const authSession = await fetchAuthSession();
    const idToken = authSession.tokens?.idToken?.toString();
    console.log(idToken);
    return idToken;
  }

  // used to communicate with aws services
  public async generateTemporaryCredentials() {
    const idToken = await this.getIdToken();

    if (!idToken) {
      throw new Error("No ID token available. Please login first.");
    }

    const cognitoIdentityPool = `cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;

    // this identity contains the credential that can be used for auth
    const cognitoIdentity = new CognitoIdentityClient({
      credentials: fromCognitoIdentityPool({
        identityPoolId: IDENTITY_POOL_ID,
        logins: {
          [cognitoIdentityPool]: idToken,
        },
      }),
    });
    const credentials = await cognitoIdentity.config.credentials();
    return credentials;
  }
}

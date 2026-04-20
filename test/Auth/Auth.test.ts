import { assert } from "console";
import { AuthServices } from "./AuthServices";

async function testAuth() {
  const authServices = new AuthServices();

  const signInOutput = await authServices.login("hikmathakim.dev@gmail.com", "Dev13579!");
  console.log(signInOutput);

  const idToken = await authServices.getIdToken();
  console.log(idToken);

  const credetnials = await authServices.generateTemporaryCredentials();

}



testAuth();

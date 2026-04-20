import { AuthService } from "./AuthServices";

async function testAuth() {
  const service = new AuthService();
  const loginResult = await service.login("hikmathakim.dev@gmail.com", "Dev13579!");
  const idToken = await service.getIdToken();
  console.log(idToken);
}

testAuth();

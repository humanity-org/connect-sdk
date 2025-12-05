export type JwksKey = {
  kty: string;
  use: "sig";
  kid: string;
  alg: string;
  n: string;
  e: string;
};

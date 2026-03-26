type NgAppProcessEnv = {
  readonly NG_APP_API_URL?: string;
  readonly NG_APP_PRODUCTION?: string;
};

declare const process: {
  env: NgAppProcessEnv;
};

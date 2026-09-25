type NgAppProcessEnv = {
  readonly NG_APP_API_URL?: string;
  readonly NG_APP_PRODUCTION?: string;
  readonly NG_APP_UPLOAD_PUBLIC_PATH?: string;
};

declare const process: {
  env: NgAppProcessEnv;
};

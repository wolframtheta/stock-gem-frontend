type NgAppProcessEnv = {
  readonly NG_APP_API_URL?: string;
  readonly NG_APP_PRODUCTION?: string;
  readonly NG_APP_UPLOAD_PUBLIC_PATH?: string;
  /** Optional full base for image URLs (GET / <img>); upload POST still uses API URL + upload path. */
  readonly NG_APP_ASSET_PUBLIC_BASE_URL?: string;
};

declare const process: {
  env: NgAppProcessEnv;
};

const isDev = process.env.NODE_ENV === 'development'

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-northeast-2_GoxCYCYrq',
      userPoolClientId: '6pufes9kh6a6cvmsfm1ccb9fmv',
      identityPoolId: 'ap-northeast-2:c82f6e46-503c-48d7-b54e-556da66bf342',
      allowGuestAccess: false,
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: 'ap-northeast-2goxcycyrq.auth.ap-northeast-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: isDev
            ? ['http://localhost:9000/authComplate']
            : ['https://aitour.awesomble.com/authComplate'],
          redirectSignOut: isDev
            ? ['http://localhost:9000/home']
            : ['https://aitour.awesomble.com/home'],
          responseType: 'code'
        }
      }
    }
  }
}
export default amplifyConfig

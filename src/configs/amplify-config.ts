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
          redirectSignIn: ['https://aitour.awesomble.com/authComplate', 'http://localhost:9000/authComplate'],
          redirectSignOut: ['https://aitour.awesomble.com/', 'http://localhost:9000/'],
          responseType: 'code'
        }
      }
    }
  }
}
export default amplifyConfig

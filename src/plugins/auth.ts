import { UserManager } from 'oidc-client-ts'

const cognitoAuthConfig = {
  authority: "https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_GoxCYCYrq",
  client_id: "6pufes9kh6a6cvmsfm1ccb9fmv",
  redirect_uri: "http://localhost:9000/auth",
  response_type: "code",
  scope: "email openid profile"
}

// create a UserManager instance
export const userManager = new UserManager({
  ...cognitoAuthConfig
})

export async function signOutRedirect() {
  const clientId = '6pufes9kh6a6cvmsfm1ccb9fmv'
  const logoutUri = '<logout uri>'
  const cognitoDomain = 'https://ap-northeast-2goxcycyrq.auth.ap-northeast-2.amazoncognito.com'
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`
}

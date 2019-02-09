const httpSignature = require('http-signature')
const isValidSig = (req, hmac) => {
  const headers = { ...req.headers, signature: 'Signature ' + req.headers.signature }
  const parsedSig = httpSignature.parseRequest({ headers }, { authorizationHeaderName: 'signature' })
  return httpSignature.verifyHMAC(parsedSig, hmac)
}

module.exports = isValidSig
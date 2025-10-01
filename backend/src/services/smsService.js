const axios = require('axios')
const crypto = require('crypto')

// 阿里云短信服务配置
const SMS_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  signName: process.env.ALIYUN_SMS_SIGN_NAME || '答题抽签',
  templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789',
  endpoint: 'https://dysmsapi.aliyuncs.com'
}

// 生成签名
const generateSignature = (params, accessKeySecret) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`
  const signature = crypto
    .createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64')
  
  return signature
}

// 发送短信验证码
const sendSmsCode = async (phone) => {
  try {
    // 如果没有配置阿里云短信服务，使用模拟发送
    if (!SMS_CONFIG.accessKeyId || !SMS_CONFIG.accessKeySecret) {
      console.log(`📱 模拟发送验证码到 ${phone}: 123456`)
      return { success: true, message: '验证码发送成功' }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const timestamp = new Date().toISOString()
    
    const params = {
      AccessKeyId: SMS_CONFIG.accessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      PhoneNumbers: phone,
      SignName: SMS_CONFIG.signName,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: Math.random().toString(36).substring(2, 15),
      SignatureVersion: '1.0',
      TemplateCode: SMS_CONFIG.templateCode,
      TemplateParam: JSON.stringify({ code }),
      Timestamp: timestamp,
      Version: '2017-05-25'
    }

    params.Signature = generateSignature(params, SMS_CONFIG.accessKeySecret)

    const response = await axios.get(SMS_CONFIG.endpoint, { params })
    
    if (response.data.Code === 'OK') {
      console.log(`📱 验证码发送成功: ${phone}`)
      return { success: true, message: '验证码发送成功' }
    } else {
      throw new Error(response.data.Message || '发送失败')
    }
  } catch (error) {
    console.error('发送短信失败:', error)
    throw new Error(error.message || '发送验证码失败')
  }
}

module.exports = {
  sendSmsCode
}

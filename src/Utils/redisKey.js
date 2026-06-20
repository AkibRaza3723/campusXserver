

const otpKey = (email) => {
    return `otp:${email}`;
}

export {otpKey}
export type LoginDto = {
    username: string;
    password: string;
}

export type ForgotPasswordDto = {
    email: string;
}

export type ResetPasswordDto = {
    email: string;
    otp: string;
    newPassword: string;
}
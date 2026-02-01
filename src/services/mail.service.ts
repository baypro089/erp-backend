import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from 'nodemailer';
import * as pug from 'pug';
import * as path from 'path';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: this.configService.get('MAIL_SECURE') === 'true',
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASS'),
            },
        });
    }

    private renderTemplate(templateName: string, variables: Record<string, any>): string {
        // Use absolute path from project root
        const templatePath = path.join(process.cwd(), 'libs', 'shared', 'templates', `${templateName}.template.pug`);
        return pug.renderFile(templatePath, variables);
    }

    async sendOtpEmail(to: string, otp: string) {
        const html = this.renderTemplate('otp-email', {
            otp,
            year: new Date().getFullYear()
        });

        await this.transporter.sendMail({
            from: `"ERP System" <${this.configService.get('MAIL_SENDER')}>`,
            to,
            subject: 'Reset password OTP',
            html,
        });
    }

    async sendWelcomeEmail(to: string, username: string, employeeName: string) {
        const html = this.renderTemplate('welcome-email', {
            username,
            employeeName,
            year: new Date().getFullYear()
        });
        await this.transporter.sendMail({
            from: `"ERP System" <${this.configService.get('MAIL_SENDER')}>`,
            to,
            subject: `Welcome to ERP System ${username}`,
            html,
        });
    }
}

import * as H from './helpers';
import * as LOG from './logger';
import { Config } from '../config';
import * as nodemailer from 'nodemailer';

export class Email {
    private static transporter: nodemailer.Transporter | null = null;

    /** If @from is undefined, we use the first Config.it.itopsEmail entry; If @to is undefined, we send to all emails in Config.it.itopsEmail */
    static async Send(from?: string | undefined, to?: string | undefined,
        subject?: string | undefined, text?: string | undefined, html?: string | undefined): Promise<H.IOResults> {

        if (!from) {
            if (Config.it.itopsEmail.length === 0) {
                const error: string = 'No "From" Email Address Specified';
                return { success: false, error };
            }
            from = Config.it.itopsEmail[0];
        }

        if (!to) {
            if (Config.it.itopsEmail.length === 0) {
                const error: string = 'No "To" Email Address Specified';
                return { success: false, error };
            }
            to = Config.it.itopsEmail.join(',');
        }

        try {
            const transporter: nodemailer.Transporter = Email.Transporter();
            const mailResponse = await transporter.sendMail({ from, to, subject, text, html });
            LOG.info(`Email.Send from ${from} -> ${to}, subject ${subject}: ${H.Helpers.JSONStringify(mailResponse)}`, LOG.LS.eSYS);
            return { success: true };
        } catch (err) {
            const error: string = `Email.Send from ${from} -> ${to}, subject ${subject} Failed`;
            LOG.error(error, LOG.LS.eSYS, err);
            return { success: false, error };
        }
    }

    private static Transporter(): nodemailer.Transporter {
        if (!Email.transporter) {
            Email.transporter = nodemailer.createTransport({
                host: Config.it.smtpHost,
                port: Config.it.smtpPort,
                secure: Config.it.smtpSecure,
                auth: {
                    user: Config.it.smtpAuthUser,
                    pass: Config.it.smtpAuthPassword
                }
            });
        }
        return Email.transporter;
    }
}
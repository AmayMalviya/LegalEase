export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer'; 
import crypto from 'crypto'; 

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { email } = await request.json();

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const token = crypto.randomBytes(32).toString('hex');

        // Store the token in the PasswordReset model
        await prisma.passwordReset.create({
            data: { 
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 3600000) // Token valid for 1 hour
            }
        });

        // Send token via email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Password Reset Token',
            text: `Your password reset token is ${token} It is valid for 1 hour.`
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Token sent to email' }, { status: 200 });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

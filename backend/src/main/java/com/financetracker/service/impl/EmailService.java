package com.financetracker.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendWelcomeEmail(String to, String firstName) {
        String subject = "Welcome to AI Finance Tracker! 🎉";
        String body = """
            <html><body style="font-family:sans-serif;background:#f4f7f9;padding:20px">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center">
                <h1 style="color:white;margin:0">💰 Finance AI</h1>
              </div>
              <div style="padding:40px">
                <h2>Welcome, %s! 🎉</h2>
                <p>Your account is ready. Start tracking your finances with AI-powered insights.</p>
                <a href="%s/dashboard" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
                  Go to Dashboard →
                </a>
              </div>
            </div></body></html>
            """.formatted(firstName, frontendUrl);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendOtpEmail(String to, String firstName, String otp) {
        String subject = "Your Verification OTP";
        String body = """
            <html><body style="font-family:sans-serif;background:#f4f7f9;padding:20px">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center">
                <h1 style="color:white;margin:0">📧 Verify Account</h1>
              </div>
              <div style="padding:40px;text-align:center">
                <p>Hi %s, use this OTP to verify your account (valid 10 minutes):</p>
                <div style="background:#eef2ff;border:2px solid #667eea;border-radius:12px;padding:24px;margin:24px 0">
                  <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#667eea;font-family:monospace">%s</div>
                </div>
                <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
              </div>
            </div></body></html>
            """.formatted(firstName, otp);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String firstName, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String subject = "Reset Your Password";
        String body = """
            <html><body style="font-family:sans-serif;background:#f4f7f9;padding:20px">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#f093fb,#f5576c);padding:40px;text-align:center">
                <h1 style="color:white;margin:0">🔒 Reset Password</h1>
              </div>
              <div style="padding:40px">
                <h2>Hi %s,</h2>
                <p>Click below to reset your password. Link expires in 1 hour.</p>
                <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#f093fb,#f5576c);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
                  Reset Password →
                </a>
              </div>
            </div></body></html>
            """.formatted(firstName, link);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendBudgetAlert(String to, String firstName, String budgetName,
                                 BigDecimal spent, BigDecimal total, double pct) {
        String subject = "⚠️ Budget Alert: " + budgetName;
        String body = """
            <html><body style="font-family:sans-serif;background:#f4f7f9;padding:20px">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#f7971e,#ffd200);padding:40px;text-align:center">
                <h1 style="color:white;margin:0">⚠️ Budget Alert</h1>
              </div>
              <div style="padding:40px">
                <h2>Hi %s,</h2>
                <p>Your <strong>%s</strong> budget has reached <strong>%.1f%%</strong>.</p>
                <p>Spent: <strong>$%.2f</strong> / Budget: <strong>$%.2f</strong></p>
                <div style="background:#e9ecef;border-radius:8px;height:12px;margin:12px 0">
                  <div style="background:linear-gradient(135deg,#f7971e,#f5576c);border-radius:8px;height:100%%;width:%.0f%%"></div>
                </div>
              </div>
            </div></body></html>
            """.formatted(firstName, budgetName, pct, spent.doubleValue(), total.doubleValue(), pct);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendMonthlySummary(String to, String firstName, BigDecimal income,
                                    BigDecimal expenses, BigDecimal savings, String month) {
        String subject = "Your Monthly Finance Summary - " + month;
        double savingsRate = income.compareTo(BigDecimal.ZERO) > 0
                ? savings.doubleValue() / income.doubleValue() * 100 : 0;
        String body = """
            <html><body style="font-family:sans-serif;background:#f4f7f9;padding:20px">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#11998e,#38ef7d);padding:40px;text-align:center">
                <h1 style="color:white;margin:0">📊 Monthly Summary</h1>
                <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">%s</p>
              </div>
              <div style="padding:40px">
                <h2>Hi %s!</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0">
                  <div style="background:#f8f9fa;border-radius:12px;padding:20px;text-align:center">
                    <div style="font-size:12px;color:#888;text-transform:uppercase">Income</div>
                    <div style="font-size:24px;font-weight:700;color:#11998e">$%.2f</div>
                  </div>
                  <div style="background:#f8f9fa;border-radius:12px;padding:20px;text-align:center">
                    <div style="font-size:12px;color:#888;text-transform:uppercase">Expenses</div>
                    <div style="font-size:24px;font-weight:700;color:#f5576c">$%.2f</div>
                  </div>
                  <div style="background:#f8f9fa;border-radius:12px;padding:20px;text-align:center">
                    <div style="font-size:12px;color:#888;text-transform:uppercase">Savings</div>
                    <div style="font-size:24px;font-weight:700;color:#667eea">$%.2f</div>
                  </div>
                  <div style="background:#f8f9fa;border-radius:12px;padding:20px;text-align:center">
                    <div style="font-size:12px;color:#888;text-transform:uppercase">Savings Rate</div>
                    <div style="font-size:24px;font-weight:700;color:#333">%.1f%%</div>
                  </div>
                </div>
              </div>
            </div></body></html>
            """.formatted(month, firstName, income.doubleValue(), expenses.doubleValue(),
                savings.doubleValue(), savingsRate);
        sendHtml(to, subject, body);
    }

    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}

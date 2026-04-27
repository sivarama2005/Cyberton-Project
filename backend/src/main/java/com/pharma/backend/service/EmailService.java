package com.pharma.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import com.pharma.backend.entity.Order;
import com.pharma.backend.entity.OrderItem;
import com.pharma.backend.repository.OrderRepository;
import com.pharma.backend.repository.OrderItemRepository;
import java.util.List;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    public void sendOrderStatusUpdate(String toEmail, Long orderId, String status) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return;

        List<OrderItem> items = orderItemRepository.findByOrder_Id(orderId);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("PharmaCare Order Status Update: " + status);
            
            StringBuilder htmlMsg = new StringBuilder();
            htmlMsg.append("<h2>PharmaCare - Order #").append(orderId).append(" Update</h2>");
            htmlMsg.append("<p>Dear Customer, your order is now: <strong>").append(status).append("</strong></p>");
            htmlMsg.append("<h3>Order Summary:</h3>");
            htmlMsg.append("<table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse;'>");
            htmlMsg.append("<tr style='background-color:#f8f9fa;'><th>Medicine</th><th>Quantity</th><th>Price</th></tr>");
            
            for (OrderItem item : items) {
                htmlMsg.append("<tr>");
                htmlMsg.append("<td>").append(item.getMedicine() != null ? item.getMedicine().getName() : "Medicine").append("</td>");
                htmlMsg.append("<td>").append(item.getQuantity()).append("</td>");
                htmlMsg.append("<td>₹").append(item.getPrice()).append("</td>");
                htmlMsg.append("</tr>");
            }
            
            htmlMsg.append("</table>");
            htmlMsg.append("<h3>Total Amount: ₹").append(order.getTotalAmount()).append("</h3>");
            htmlMsg.append("<br><p>Thank you for choosing PharmaCare.</p>");
            
            helper.setText(htmlMsg.toString(), true);
            mailSender.send(message);
            System.out.println("[EMAIL] Sent HTML confirmation to " + toEmail);
        } catch (Exception e) {
            System.err.println("[EMAIL] Failed to send to " + toEmail + ": " + e.getMessage());
        }
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("PharmaCare - Your Password Reset OTP");
            String html = "<div style='font-family:sans-serif;max-width:480px;margin:auto;padding:32px;"
                + "border:1px solid #e5e7eb;border-radius:12px;text-align:center'>"
                + "<h2 style='color:#0d9488;margin-bottom:4px'>PharmaCare</h2>"
                + "<p style='color:#6b7280;margin-top:0'>Password Reset</p>"
                + "<p style='color:#374151;margin:24px 0 8px'>Use the OTP below to reset your password.<br>"
                + "It expires in <strong>10 minutes</strong>.</p>"
                + "<div style='font-size:40px;font-weight:900;letter-spacing:12px;color:#0d9488;"
                + "background:#f0fdfa;border:2px dashed #99f6e4;border-radius:12px;"
                + "padding:20px 32px;display:inline-block;margin:16px 0'>" + otp + "</div>"
                + "<p style='color:#9ca3af;font-size:12px;margin-top:24px'>"
                + "If you didn't request this, ignore this email.</p>"
                + "</div>";
            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("[EMAIL] OTP sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("[EMAIL] FAILED to send OTP to " + toEmail);
            System.err.println("[EMAIL] Reason: " + e.getMessage());
            System.err.println("[EMAIL] Check: Gmail App Password may be expired. Go to https://myaccount.google.com/apppasswords to generate a new one.");
        }
    }

    public void sendOrderConfirmation(String toEmail, Order order, List<OrderItem> items) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("PharmaCare Order Confirmation: #" + order.getId());
            
            StringBuilder htmlMsg = new StringBuilder();
            htmlMsg.append("<h2>Thank you for your order, ").append(order.getUser().getUsername()).append("!</h2>");
            htmlMsg.append("<p>Order ID: <strong>#").append(order.getId()).append("</strong></p>");
            htmlMsg.append("<p>Status: <strong>PENDING REVIEW</strong></p>");
            htmlMsg.append("<h3>Items Ordered:</h3>");
            htmlMsg.append("<table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse;'>");
            htmlMsg.append("<tr style='background-color:#f8f9fa;'><th>Medicine</th><th>Quantity</th><th>Price</th></tr>");
            
            for (OrderItem item : items) {
                htmlMsg.append("<tr>");
                htmlMsg.append("<td>").append(item.getMedicine() != null ? item.getMedicine().getName() : "Medicine").append("</td>");
                htmlMsg.append("<td>").append(item.getQuantity()).append("</td>");
                htmlMsg.append("<td>₹").append(item.getPrice()).append("</td>");
                htmlMsg.append("</tr>");
            }
            
            htmlMsg.append("</table>");
            if (order.getDiscountAmount() > 0) {
                htmlMsg.append("<p>Discount Applied: ₹").append(order.getDiscountAmount()).append("</p>");
            }
            htmlMsg.append("<h3>Total Paid Amount: ₹").append(order.getTotalAmount()).append("</h3>");
            htmlMsg.append("<p><strong>Shipping to:</strong> ").append(order.getAddress()).append("</p>");
            htmlMsg.append("<br><p>Our team will review your order and prescription shortly.</p>");
            
            helper.setText(htmlMsg.toString(), true);
            mailSender.send(message);
            System.out.println("[EMAIL] Sent Order Confirmation to " + toEmail);
        } catch (Exception e) {
            System.err.println("[EMAIL] Failed to send confirmation to " + toEmail + ": " + e.getMessage());
        }
    }
}

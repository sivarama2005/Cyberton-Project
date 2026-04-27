package com.pharma.backend.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;
    
    // In a real scenario, you'd initialize this once
    private boolean isTwilioConfigured = false;

    @PostConstruct
    public void setup() {
        if (accountSid != null && !accountSid.isEmpty() && !accountSid.equals("your_account_sid")) {
            try {
                Twilio.init(accountSid, authToken);
                isTwilioConfigured = true;
                System.out.println("Twilio SMS Service Configured.");
            } catch (Exception e) {
                System.err.println("Failed to configure Twilio: " + e.getMessage());
            }
        } else {
            System.out.println("Twilio credentials not found. SMS will be logged to console only.");
        }
    }

    public void sendOrderStatusUpdate(String toPhoneNumber, Long orderId, String status) {
        String msgBody = "PharmaCare Update: Your order #" + orderId + " is now " + status + ". Thanks for shopping with us!";
        
        if (!isTwilioConfigured) {
            System.out.println("\n[MOCK SMS SEND] -> To: " + toPhoneNumber + " | Body: " + msgBody + "\n");
            return;
        }
        
        try {
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    msgBody
            ).create();
            
            System.out.println("SMS sent to " + toPhoneNumber + " successfully. SID: " + message.getSid());
        } catch (Exception e) {
            System.err.println("Failed to send SMS to " + toPhoneNumber + ": " + e.getMessage());
        }
    }
}

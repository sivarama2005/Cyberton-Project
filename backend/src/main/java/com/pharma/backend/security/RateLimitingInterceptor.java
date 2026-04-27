package com.pharma.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    // Simple Token Bucket per IP (Max 20 requests per 10 seconds)
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = request.getRemoteAddr();
        
        TokenBucket bucket = buckets.computeIfAbsent(clientIp, k -> new TokenBucket(20, 10000));
        
        if (bucket.tryConsume()) {
            return true;
        } else {
            response.setStatus(429); // HTTP 429 Too Many Requests
            response.getWriter().write("Rate limit exceeded. Try again later.");
            return false;
        }
    }

    private static class TokenBucket {
        private final int capacity;
        private final long refillDurationMs;
        private int tokens;
        private long lastRefillTimestamp;

        public TokenBucket(int capacity, long refillDurationMs) {
            this.capacity = capacity;
            this.refillDurationMs = refillDurationMs;
            this.tokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            if (now - lastRefillTimestamp > refillDurationMs) {
                tokens = capacity;
                lastRefillTimestamp = now;
            }
        }
    }
}

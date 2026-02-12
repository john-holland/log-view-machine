package com.mod.ecommerce.api;

import com.mod.ecommerce.database.DatabaseManager;
import com.mod.ecommerce.database.Donation;
import io.javalin.http.Context;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class RedeemHandler {
    private static final Logger logger = LoggerFactory.getLogger(RedeemHandler.class);
    private final DatabaseManager dbManager;
    private final ObjectMapper objectMapper = new ObjectMapper();
    // Track last redeem time per name for backoff enforcement
    private final Map<String, Long> lastRedeemTime = new ConcurrentHashMap<>();
    private static final long BACKOFF_MS = 60_000; // 1 minute
    
    public RedeemHandler(DatabaseManager dbManager) {
        this.dbManager = dbManager;
    }
    
    public void handle(Context ctx) {
        try {
            Map<String, Object> payload = objectMapper.readValue(ctx.body(), Map.class);
            String name = (String) payload.get("name");
            
            if (name == null || name.trim().isEmpty()) {
                ctx.status(400).json(Map.of("error", "Missing required field: name"));
                return;
            }
            
            name = name.trim();
            
            // Check backoff
            Long lastRedeem = lastRedeemTime.get(name);
            if (lastRedeem != null) {
                long elapsed = System.currentTimeMillis() - lastRedeem;
                if (elapsed < BACKOFF_MS) {
                    long remainingSeconds = (BACKOFF_MS - elapsed) / 1000;
                    ctx.status(429)
                        .header("Retry-After", String.valueOf(remainingSeconds))
                        .json(Map.of(
                            "error", "Backoff period active",
                            "backoff_seconds", remainingSeconds,
                            "message", "Please wait " + remainingSeconds + " seconds before redeeming again"
                        ));
                    return;
                }
            }
            
            // Find unredeemed donation
            Optional<Donation> donationOpt = dbManager.findUnredeemedDonation(name);
            
            if (donationOpt.isEmpty()) {
                ctx.status(404).json(Map.of(
                    "success", false,
                    "message", "No unredeemed donation found for name: " + name
                ));
                return;
            }
            
            Donation donation = donationOpt.get();
            
            // Mark as redeemed
            dbManager.markAsRedeemed(donation.getId(), name);
            
            // Update last redeem time
            lastRedeemTime.put(name, System.currentTimeMillis());
            
            logger.info("Donation {} redeemed by {}", donation.getId(), name);
            
            ctx.status(200)
                .header("Retry-After", "60")
                .json(Map.of(
                    "success", true,
                    "donation_id", donation.getId(),
                    "amount", donation.getAmount(),
                    "currency", donation.getCurrency(),
                    "backoff_seconds", 60,
                    "message", "Donation redeemed successfully"
                ));
            
        } catch (SQLException e) {
            logger.error("Database error during redeem", e);
            ctx.status(500).json(Map.of("error", "Database error"));
        } catch (Exception e) {
            logger.error("Error processing redeem request", e);
            ctx.status(500).json(Map.of("error", "Internal server error"));
        }
    }
}

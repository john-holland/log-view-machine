package com.mod.ecommerce.webhook;

import com.mod.ecommerce.database.DatabaseManager;
import com.mod.ecommerce.database.Donation;
import io.javalin.http.Context;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.Map;

public class TipTopJarWebhookHandler {
    private static final Logger logger = LoggerFactory.getLogger(TipTopJarWebhookHandler.class);
    private final DatabaseManager dbManager;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public TipTopJarWebhookHandler(DatabaseManager dbManager) {
        this.dbManager = dbManager;
    }
    
    public void handle(Context ctx) {
        try {
            Map<String, Object> payload = objectMapper.readValue(ctx.body(), Map.class);
            
            // Extract Tip Top Jar fields (case-insensitive handling)
            String tipperName = getString(payload, "Tipper_Name", "tipper_name");
            String recipientAccount = getString(payload, "Recipient_Account", "recipient_account");
            Object amountObj = payload.getOrDefault("Amount", payload.get("amount"));
            String currency = getString(payload, "Currency", "currency");
            Object timestampObj = payload.getOrDefault("Timestamp", payload.get("timestamp"));
            String webhookTrackingParams = objectMapper.writeValueAsString(
                payload.getOrDefault("webhookTrackingParams", payload.get("webhook_tracking_params"))
            );
            
            if (tipperName == null || recipientAccount == null || amountObj == null) {
                ctx.status(400).json(Map.of("error", "Missing required fields: Tipper_Name, Recipient_Account, Amount"));
                return;
            }
            
            BigDecimal amount = amountObj instanceof Number 
                ? BigDecimal.valueOf(((Number) amountObj).doubleValue())
                : new BigDecimal(amountObj.toString());
            
            long timestampMs = timestampObj instanceof Number
                ? ((Number) timestampObj).longValue()
                : System.currentTimeMillis();
            
            // Create donation object
            Donation donation = new Donation();
            donation.setTipperName(tipperName);
            donation.setRecipientAccount(recipientAccount);
            donation.setAmount(amount);
            donation.setCurrency(currency != null ? currency : "USD");
            donation.setTimestampMs(timestampMs);
            donation.setWebhookTrackingParams(webhookTrackingParams);
            donation.setTenantId(getString(payload, "tenant_id", "tenantId"));
            
            // Store in database
            dbManager.insertDonation(donation);
            
            logger.info("Tip Top Jar webhook processed: {} donated {} {} to {}", 
                tipperName, amount, donation.getCurrency(), recipientAccount);
            
            ctx.status(200).json(Map.of("success", true, "message", "Donation recorded"));
            
        } catch (Exception e) {
            logger.error("Error processing Tip Top Jar webhook", e);
            ctx.status(500).json(Map.of("error", "Internal server error"));
        }
    }
    
    private String getString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object value = map.get(key);
            if (value != null) {
                return value.toString();
            }
        }
        return null;
    }
}

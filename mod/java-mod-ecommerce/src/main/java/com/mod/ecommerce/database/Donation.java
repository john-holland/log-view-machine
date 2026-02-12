package com.mod.ecommerce.database;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class Donation {
    private Long id;
    private String tipperName;
    private String recipientAccount;
    private BigDecimal amount;
    private String currency;
    private Long timestampMs;
    private String webhookTrackingParams;
    private Timestamp createdAt;
    private Timestamp redeemedAt;
    private String redeemedByName;
    private String associatedTomeOrSession;
    private String tenantId;
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTipperName() { return tipperName; }
    public void setTipperName(String tipperName) { this.tipperName = tipperName; }
    
    public String getRecipientAccount() { return recipientAccount; }
    public void setRecipientAccount(String recipientAccount) { this.recipientAccount = recipientAccount; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public Long getTimestampMs() { return timestampMs; }
    public void setTimestampMs(Long timestampMs) { this.timestampMs = timestampMs; }
    
    public String getWebhookTrackingParams() { return webhookTrackingParams; }
    public void setWebhookTrackingParams(String webhookTrackingParams) { this.webhookTrackingParams = webhookTrackingParams; }
    
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    
    public Timestamp getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(Timestamp redeemedAt) { this.redeemedAt = redeemedAt; }
    
    public String getRedeemedByName() { return redeemedByName; }
    public void setRedeemedByName(String redeemedByName) { this.redeemedByName = redeemedByName; }
    
    public String getAssociatedTomeOrSession() { return associatedTomeOrSession; }
    public void setAssociatedTomeOrSession(String associatedTomeOrSession) { this.associatedTomeOrSession = associatedTomeOrSession; }
    
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
